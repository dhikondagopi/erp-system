const { pool, query } = require('../config/db');
const vendorRepository = require('../repositories/vendorRepository');
const geminiService = require('./geminiService');

/**
 * Vendor Service.
 * Implements logical routines for Vendor profiles and performance scorecards.
 */
class VendorService {
  async getVendorById(id) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) {
      const error = new Error(`Vendor with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return vendor;
  }

  async getAllVendors(queryParams) {
    const { search, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { vendors, total } = await vendorRepository.findAll({
      search: search ? search.trim() : null,
      limit: parsedLimit,
      offset
    });

    return {
      vendors,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async createVendor(vendorData) {
    const existing = await vendorRepository.findByEmail(vendorData.email.trim());
    if (existing) {
      const error = new Error(`Vendor profile conflict: Email '${vendorData.email}' is already registered.`);
      error.statusCode = 409;
      throw error;
    }

    const formattedData = {
      ...vendorData,
      name: vendorData.name.trim(),
      email: vendorData.email.trim().toLowerCase(),
      phone: vendorData.phone ? vendorData.phone.trim() : null,
      address: vendorData.address ? vendorData.address.trim() : null
    };

    return await vendorRepository.create(formattedData);
  }

  async updateVendor(id, vendorData) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) {
      const error = new Error(`Update failed: Vendor with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    const emailMatch = await vendorRepository.findByEmail(vendorData.email.trim());
    if (emailMatch && emailMatch.id !== id) {
      const error = new Error(`Vendor profile conflict: Email '${vendorData.email}' is already used by another vendor profile.`);
      error.statusCode = 409;
      throw error;
    }

    const formattedData = {
      ...vendorData,
      name: vendorData.name.trim(),
      email: vendorData.email.trim().toLowerCase(),
      phone: vendorData.phone ? vendorData.phone.trim() : null,
      address: vendorData.address ? vendorData.address.trim() : null
    };

    return await vendorRepository.update(id, formattedData);
  }

  async deleteVendor(id) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) {
      const error = new Error(`Delete failed: Vendor with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    return await vendorRepository.delete(id);
  }

  /**
   * Calculate Vendor Performance Scorecard metrics.
   */
  async getVendorScorecard(id) {
    const vendor = await this.getVendorById(id);

    // SQL query to calculate spend and lead times
    const statsSql = `
      SELECT 
        COUNT(po.id) AS total_orders,
        COALESCE(AVG(EXTRACT(EPOCH FROM (po.updated_at - po.created_at)) / 86400.0), 0.00) AS avg_lead_time_days,
        COALESCE(SUM(po.total_amount), 0.00) AS total_purchase_volume,
        COALESCE(
          COUNT(CASE WHEN (EXTRACT(EPOCH FROM (po.updated_at - po.created_at)) / 86400.0) <= COALESCE(
            (SELECT AVG(vp.lead_time_days) 
             FROM purchase_order_items poi 
             JOIN vendor_products vp ON poi.product_id = vp.product_id AND vp.vendor_id = po.vendor_id 
             WHERE poi.purchase_order_id = po.id), 5) THEN 1 END)::NUMERIC / NULLIF(COUNT(po.id), 0) * 100, 
          100.0
        ) AS on_time_delivery_rate
      FROM purchase_orders po
      WHERE po.vendor_id = $1 AND po.status = 'RECEIVED';
    `;

    const costSql = `
      SELECT COALESCE(AVG(poi.unit_cost), 0.00) AS avg_item_cost
      FROM purchase_order_items poi
      INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
      WHERE po.vendor_id = $1 AND po.status = 'RECEIVED';
    `;

    const [statsRes, costRes] = await Promise.all([
      query(statsSql, [id]),
      query(costSql, [id])
    ]);

    const stats = statsRes.rows[0];
    const avgItemCost = parseFloat(costRes.rows[0].avg_item_cost);

    const totalOrders = parseInt(stats.total_orders, 10);
    const avgLeadTime = parseFloat(stats.avg_lead_time_days);
    const totalVolume = parseFloat(stats.total_purchase_volume);
    const onTimeRate = parseFloat(stats.on_time_delivery_rate);
    const orderAccuracy = totalOrders > 0 ? 100.0 : 0.0; // In standard flows, orders are received in full

    // Calculate score: 50% on-time rate, 30% order accuracy, 20% lead time speed (e.g. perfect if <= 3 days, decreasing to 0 at 15 days)
    let leadTimeScore = 20.0;
    if (avgLeadTime > 3) {
      leadTimeScore = Math.max(0, 20.0 - (avgLeadTime - 3.0) * 1.5);
    }
    const score = Math.round((onTimeRate * 0.5) + (orderAccuracy * 0.3) + leadTimeScore);

    const scorecard = {
      vendor_id: id,
      vendor_name: vendor.name,
      total_orders: totalOrders,
      avg_lead_time_days: Math.round(avgLeadTime * 100) / 100,
      on_time_delivery_rate: Math.round(onTimeRate * 10) / 10,
      order_accuracy_rate: orderAccuracy,
      purchase_volume: totalVolume,
      avg_item_cost: avgItemCost,
      performance_score: score
    };

    // AI recommendation using Gemini
    let recommendation = 'Vendor performance metrics are within normal parameters. Maintain standard tracking.';
    if (geminiService.isConfigured() && totalOrders > 0) {
      try {
        const prompt = `
          Analyze this vendor performance scorecard for Shiv Furniture Works ERP:
          Vendor Name: ${vendor.name}
          On-Time Delivery Rate: ${scorecard.on_time_delivery_rate}%
          Average Lead Time: ${scorecard.avg_lead_time_days} days
          Order Accuracy: ${scorecard.order_accuracy_rate}%
          Total Spend Volume: Rs ${scorecard.purchase_volume}
          Average Purchased Cost: Rs ${scorecard.avg_item_cost}
          Combined Score: ${scorecard.performance_score} / 100

          Provide a professional vendor feedback assessment and supplier recommendation in maximum 2 clear, actionable sentences.
        `;
        const systemInstruction = 'You are an ERP Vendor Analytics Advisor. Provide concise, business-oriented supplier recommendations.';
        recommendation = await geminiService.generateTextResponse(prompt, systemInstruction);
      } catch (err) {
        console.error('Gemini Scorecard Suggestion Error:', err.message);
      }
    } else if (totalOrders === 0) {
      recommendation = 'No purchase orders have been received from this vendor yet. Unable to evaluate performance recommendations.';
    }

    scorecard.recommendation = recommendation;
    return scorecard;
  }

  /**
   * Get Vendor Performance overview list to show best/worst and AI suggestions.
   */
  async getPerformanceOverview() {
    const vendors = await vendorRepository.findAll({ limit: 100, offset: 0 });
    const scorecards = [];

    for (const vendor of vendors.vendors) {
      const card = await this.getVendorScorecard(vendor.id);
      scorecards.push(card);
    }

    // Sort by performance score descending
    scorecards.sort((a, b) => b.performance_score - a.performance_score);

    const bestVendors = scorecards.filter(c => c.total_orders > 0 && c.performance_score >= 80);
    const worstVendors = scorecards.filter(c => c.total_orders > 0 && c.performance_score < 70);

    return {
      all_vendors: scorecards,
      best_vendors: bestVendors.slice(0, 3),
      worst_vendors: worstVendors.slice(0, 3)
    };
  }
}

module.exports = new VendorService();
