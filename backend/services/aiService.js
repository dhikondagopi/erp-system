/**
 * AI Service — Live ERP Intelligence Engine
 *
 * Architecture:
 *  1. Query live PostgreSQL tables.
 *  2. Build a rich context payload from real data.
 *  3. Send context + instructions to Groq AI.
 *  4. Return the AI-generated response.
 *
 * No mock data. No offline fallbacks.
 * If Groq is unavailable, an explicit error is thrown.
 */

const { query } = require('../config/db');
const geminiService = require('./geminiService');

class AiService {
  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURE 1: AI PROCUREMENT RECOMMENDATIONS & MRP
  // ─────────────────────────────────────────────────────────────────────────────
  async getProcurementRecommendations() {
    // 1. Fetch live data
    const [inventoryRes, salesRes, poRes, moRes, bomRes] = await Promise.all([
      query(`
        SELECT
          p.id, p.name, p.sku, p.type, p.unit_price,
          i.qty_on_hand, i.qty_reserved, p.reorder_point,
          (i.qty_on_hand - i.qty_reserved) AS available_qty,
          COALESCE(v.name, 'No Vendor') AS vendor_name,
          COALESCE(pv.vendor_price, p.unit_price) AS vendor_price,
          COALESCE(pv.lead_time_days, 7) AS lead_time_days,
          pv.vendor_id
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN (
          SELECT DISTINCT ON (product_id) product_id, vendor_id, vendor_price, lead_time_days
          FROM vendor_products
          ORDER BY product_id, vendor_price ASC
        ) pv ON p.id = pv.product_id
        LEFT JOIN vendors v ON pv.vendor_id = v.id
        ORDER BY (i.qty_on_hand - p.reorder_point) ASC
      `),
      query(`
        SELECT soi.product_id, SUM(soi.quantity) AS pending_demand
        FROM sales_order_items soi
        JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE so.status = 'CONFIRMED'
        GROUP BY soi.product_id
      `),
      query(`
        SELECT poi.product_id, SUM(poi.quantity) AS incoming_qty
        FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.purchase_order_id = po.id
        WHERE po.status = 'APPROVED'
        GROUP BY poi.product_id
      `),
      query(`
        SELECT mo.finished_good_id AS product_id, SUM(mo.quantity) AS mo_qty
        FROM manufacturing_orders mo
        WHERE mo.status IN ('DRAFT', 'APPROVED', 'IN_PRODUCTION')
        GROUP BY mo.finished_good_id
      `),
      query(`
        SELECT bom.finished_good_id AS finished_product_id, bi.raw_material_id AS component_id, bi.quantity_required AS bom_qty
        FROM bills_of_materials bom
        JOIN bom_items bi ON bom.id = bi.bom_id
        WHERE bom.is_active = true
      `),
    ]);

    const demandMap = Object.fromEntries(salesRes.rows.map(r => [r.product_id, parseFloat(r.pending_demand) || 0]));
    const incomingMap = Object.fromEntries(poRes.rows.map(r => [r.product_id, parseFloat(r.incoming_qty) || 0]));
    const moMap = Object.fromEntries(moRes.rows.map(r => [r.product_id, parseFloat(r.mo_qty) || 0]));

    const inventory = inventoryRes.rows.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      type: item.type,
      qty_on_hand: parseFloat(item.qty_on_hand) || 0,
      qty_reserved: parseFloat(item.qty_reserved) || 0,
      available_qty: parseFloat(item.available_qty) || 0,
      reorder_point: parseFloat(item.reorder_point) || 0,
      pending_demand: demandMap[item.id] || 0,
      incoming_qty: incomingMap[item.id] || 0,
      manufacturing_qty: moMap[item.id] || 0,
      vendor_name: item.vendor_name,
      vendor_price: parseFloat(item.vendor_price) || 0,
      lead_time_days: parseInt(item.lead_time_days) || 7,
      vendor_id: item.vendor_id,
    }));

    const context = JSON.stringify({ inventory, bom: bomRes.rows });

    const systemInstruction = `You are an AI Procurement and MRP Engine for a furniture manufacturing ERP system.
Analyze the inventory, demand, and BOM data and generate procurement recommendations.
Return ONLY valid JSON matching this exact schema:
{
  "shortages": [{ "id": "uuid", "name": "str", "sku": "str", "type": "str", "qty_on_hand": 0, "qty_reserved": 0, "available_qty": 0, "pending_demand": 0, "shortage_qty": 0, "incoming_qty": 0 }],
  "recommendations": [{ "type": "PURCHASE|MANUFACTURE", "id": "uuid", "name": "str", "sku": "str", "quantity": 0, "vendor_name": "str", "vendor_price": 0, "lead_time_days": 0, "confidence_score": 0-100, "reason": "str", "required_materials": [{ "name": "str", "quantity_required": 0 }] }],
  "alerts": [{ "severity": "HIGH|MEDIUM|LOW", "message": "str" }],
  "summary": "str"
}
Rules:
- shortage_qty = pending_demand - available_qty - incoming_qty (if > 0)
- For raw materials with shortage: recommend PURCHASE from preferred vendor
- For finished goods with shortage that have BOM: recommend MANUFACTURE
- Only include items with actual shortages or reorder point breaches
- confidence_score should reflect data quality and urgency (0-100)`;

    const prompt = `Analyze this ERP data and generate procurement recommendations:\n${context}`;

    const result = await geminiService.generateStructuredResponse(prompt, systemInstruction);
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURE 2: AI INVENTORY INSIGHTS & OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────
  async getInventoryInsights() {
    const [inventoryRes, movementsRes] = await Promise.all([
      query(`
        SELECT
          p.id, p.name, p.sku, p.type, p.unit_price,
          i.qty_on_hand, i.qty_reserved, p.reorder_point,
          (i.qty_on_hand - i.qty_reserved) AS available_qty,
          (i.qty_on_hand * p.unit_price) AS stock_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        ORDER BY (i.qty_on_hand - p.reorder_point) ASC
      `),
      query(`
        SELECT product_id, transaction_type, SUM(ABS(qty_change)) AS total_qty, COUNT(*) AS movement_count
        FROM stock_ledger
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_id, transaction_type
        ORDER BY product_id
      `),
    ]);

    const context = JSON.stringify({
      inventory: inventoryRes.rows,
      recent_movements: movementsRes.rows,
    });

    const systemInstruction = `You are an AI Inventory Optimization Specialist for a furniture ERP system.
Analyze inventory levels, stock ledger, and reorder points.
Return ONLY valid JSON matching this exact schema:
{
  "inventory_health_score": 0-100,
  "dead_stock_alerts": [{ "name": "str", "sku": "str", "qty_on_hand": 0, "recommendation": "str" }],
  "slow_moving_alerts": [{ "name": "str", "sku": "str", "qty_on_hand": 0, "qty_sold_60_days": 0 }],
  "overstock_alerts": [{ "name": "str", "sku": "str", "qty_on_hand": 0, "reorder_point": 0, "recommendation": "str" }],
  "understock_alerts": [{ "name": "str", "sku": "str", "qty_on_hand": 0, "reorder_point": 0 }]
}
Rules:
- dead_stock_alerts: items with positive qty_on_hand that had NO stock ledger movements in the last 30 days.
- slow_moving_alerts: items with positive qty_on_hand that had very few sales/issues in the last 30 days (calculate or estimate quantity sold/issued).
- overstock_alerts: items where qty_on_hand is significantly above the reorder_point (e.g. qty_on_hand > 3 * reorder_point).
- understock_alerts: items where qty_on_hand is below or close to the reorder_point.
- inventory_health_score: numeric value from 0-100 reflecting overall health.`;

    const prompt = `Analyze this ERP inventory data and return insights:\n${context}`;
    return await geminiService.generateStructuredResponse(prompt, systemInstruction);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURE 3: AI MANUFACTURING PRODUCTION PLAN
  // ─────────────────────────────────────────────────────────────────────────────
  async generateProductionPlan(finishedGoodId, quantity) {
    const [productRes, bomRes, inventoryRes] = await Promise.all([
      query('SELECT id, name, sku, type FROM products WHERE id = $1', [finishedGoodId]),
      query(`
        SELECT bi.raw_material_id AS component_id, bi.quantity_required AS bom_qty, p.name, p.sku,
               i.qty_on_hand, i.qty_reserved, (i.qty_on_hand - i.qty_reserved) AS available
        FROM bills_of_materials bom
        JOIN bom_items bi ON bom.id = bi.bom_id
        JOIN products p ON bi.raw_material_id = p.id
        LEFT JOIN inventory i ON i.product_id = bi.raw_material_id
        WHERE bom.finished_good_id = $1 AND bom.is_active = true
      `, [finishedGoodId]),
      query('SELECT p.id, p.name, i.qty_on_hand FROM inventory i JOIN products p ON i.product_id = p.id'),
    ]);

    if (!productRes.rows.length) {
      throw new Error(`Product with ID ${finishedGoodId} not found.`);
    }

    const context = JSON.stringify({
      finished_good: productRes.rows[0],
      quantity_requested: quantity,
      bom_components: bomRes.rows,
      work_centers: [], // work_centers table not present in current schema, returning empty
    });

    const systemInstruction = `You are an AI Production Planner for a furniture manufacturing ERP.
Generate a detailed production plan for the requested manufacturing order.
Return ONLY valid JSON matching this exact schema:
{
  "production_plan": {
    "finished_good": "str",
    "quantity": 0,
    "estimated_days": 0,
    "feasibility": "FEASIBLE|PARTIAL|NOT_FEASIBLE",
    "confidence_score": 0-100
  },
  "material_requirements": [{ "name": "str", "sku": "str", "required": 0, "available": 0, "shortage": 0, "action": "str" }],
  "production_steps": [{ "step": 0, "operation": "str", "duration_hours": 0, "work_center": "str" }],
  "risks": [{ "severity": "HIGH|MEDIUM|LOW", "description": "str" }],
  "summary": "str"
}`;

    const prompt = `Generate a production plan:\n${context}`;
    return await geminiService.generateStructuredResponse(prompt, systemInstruction);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURE 4: AI BUSINESS INSIGHTS (DASHBOARD WIDGET)
  // ─────────────────────────────────────────────────────────────────────────────
  async getBusinessInsights() {
    const [salesRes, inventoryRes, poRes, moRes] = await Promise.all([
      query(`
        SELECT
          COUNT(*) AS total_orders,
          SUM(total_amount) AS total_revenue,
          COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS pending_orders,
          COUNT(*) FILTER (WHERE status = 'SHIPPED') AS delivered_orders,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS orders_last_7d,
          SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS revenue_last_7d
        FROM sales_orders
      `),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE qty_on_hand <= p.reorder_point) AS items_low_stock,
          COUNT(*) AS total_items,
          SUM(qty_on_hand * p.unit_price) AS total_stock_value
        FROM inventory i JOIN products p ON i.product_id = p.id
      `),
      query(`
        SELECT
          COUNT(*) AS total_pos,
          COUNT(*) FILTER (WHERE status IN ('PENDING_APPROVAL', 'APPROVED')) AS pending_pos,
          COUNT(*) FILTER (WHERE created_at + INTERVAL '7 days' < NOW() AND status = 'APPROVED') AS overdue_pos
        FROM purchase_orders
      `),
      query(`
        SELECT
          COUNT(*) AS total_mos,
          COUNT(*) FILTER (WHERE status = 'IN_PRODUCTION') AS active_mos,
          COUNT(*) FILTER (WHERE status = 'DRAFT') AS planned_mos
        FROM manufacturing_orders
      `),
    ]);

    const context = JSON.stringify({
      sales: salesRes.rows[0],
      inventory: inventoryRes.rows[0],
      purchase_orders: poRes.rows[0],
      manufacturing_orders: moRes.rows[0],
    });

    const systemInstruction = `You are an AI Business Intelligence analyst for a furniture manufacturing ERP system.
Provide an executive summary and key business insights based on current KPIs.
Return ONLY valid JSON matching this exact schema:
{
  "executive_summary": "str (2-3 sentences, professional tone, based only on real data)",
  "insights": [
    { "category": "Sales|Inventory|Procurement|Manufacturing", "message": "str", "severity": "INFO|WARNING|ERROR" }
  ],
  "kpi_highlights": { "revenue_trend": "str", "inventory_health": "str", "fulfillment_rate": "str" }
}
Be factual. Only mention numbers that exist in the provided data.`;

    const prompt = `Generate business insights from this live ERP data:\n${context}`;
    return await geminiService.generateStructuredResponse(prompt, systemInstruction);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURE 5: AI DEMAND FORECASTING
  // ─────────────────────────────────────────────────────────────────────────────
  async getDemandForecasts() {
    const [salesHistoryRes, inventoryRes] = await Promise.all([
      query(`
        SELECT
          p.id, p.name, p.sku,
          DATE_TRUNC('month', so.created_at) AS month,
          SUM(soi.quantity) AS quantity_sold
        FROM sales_order_items soi
        JOIN sales_orders so ON soi.sales_order_id = so.id
        JOIN products p ON soi.product_id = p.id
        WHERE so.created_at >= NOW() - INTERVAL '6 months'
          AND so.status NOT IN ('CANCELLED')
        GROUP BY p.id, p.name, p.sku, DATE_TRUNC('month', so.created_at)
        ORDER BY p.id, month
      `),
      query(`
        SELECT p.id, i.qty_on_hand, p.reorder_point
        FROM inventory i JOIN products p ON i.product_id = p.id
      `),
    ]);

    if (!salesHistoryRes.rows.length) {
      throw new Error('No sales history found in the last 6 months. Cannot generate forecasts.');
    }

    // Group by product
    const productMap = {};
    for (const row of salesHistoryRes.rows) {
      if (!productMap[row.id]) {
        productMap[row.id] = { id: row.id, name: row.name, sku: row.sku, monthly_sales: [] };
      }
      productMap[row.id].monthly_sales.push({
        month: new Date(row.month).toISOString().substring(0, 7),
        quantity: parseInt(row.quantity_sold),
      });
    }

    const inventoryByProduct = Object.fromEntries(inventoryRes.rows.map(r => [r.id, r]));
    const productsWithHistory = Object.values(productMap).slice(0, 10); // top 10 products

    const context = JSON.stringify({
      products: productsWithHistory.map(p => ({
        ...p,
        current_stock: inventoryByProduct[p.id]?.qty_on_hand || 0,
        reorder_point: inventoryByProduct[p.id]?.reorder_point || 0,
      })),
    });

    const systemInstruction = `You are an AI Demand Forecasting expert for a furniture ERP system.
Analyze the 6-month historical sales data and generate next-month demand forecasts.
Return ONLY valid JSON matching this exact schema:
{
  "forecasts": [
    {
      "id": "uuid",
      "name": "str",
      "sku": "str",
      "historical": [{ "month": "YYYY-MM", "quantity": 0 }],
      "forecast": { "month": "YYYY-MM", "expected_demand": 0, "confidence": 0-100, "recommended_stock_level": 0, "recommended_procurement_qty": 0 },
      "trend": "INCREASING|STABLE|DECREASING"
    }
  ],
  "analysis_summary": "str",
  "high_demand_products": ["str"],
  "at_risk_products": ["str"]
}
Base forecast on actual historical trend. Use simple moving average or trend extrapolation.`;

    const prompt = `Analyze sales history and generate demand forecasts:\n${context}`;
    return await geminiService.generateStructuredResponse(prompt, systemInstruction);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURE 6: AI VENDOR ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────
  async getVendorAnalysis() {
    const [vendorsRes, poRes] = await Promise.all([
      query(`
        SELECT
          v.id, v.name, v.email,
          COUNT(pv.product_id) AS products_supplied,
          AVG(pv.lead_time_days) AS avg_lead_time,
          AVG(pv.vendor_price) AS avg_unit_price
        FROM vendors v
        LEFT JOIN vendor_products pv ON v.id = pv.vendor_id
        GROUP BY v.id, v.name, v.email
        ORDER BY products_supplied DESC
      `),
      query(`
        SELECT
          po.vendor_id,
          COUNT(*) AS total_orders,
          COUNT(*) FILTER (WHERE po.status = 'RECEIVED') AS fulfilled_orders,
          COUNT(*) FILTER (WHERE po.created_at + INTERVAL '7 days' < NOW() AND po.status = 'APPROVED') AS overdue_orders,
          SUM(po.total_amount) AS total_spend,
          AVG(EXTRACT(DAY FROM (po.updated_at - po.created_at))) AS avg_fulfillment_days
        FROM purchase_orders po
        GROUP BY po.vendor_id
      `),
    ]);

    const poMap = Object.fromEntries(poRes.rows.map(r => [r.vendor_id, r]));
    const vendorData = vendorsRes.rows.map(v => ({
      ...v,
      avg_lead_time: parseFloat(v.avg_lead_time) || 0,
      avg_unit_price: parseFloat(v.avg_unit_price) || 0,
      products_supplied: parseInt(v.products_supplied) || 0,
      ...(poMap[v.id] || { total_orders: 0, fulfilled_orders: 0, overdue_orders: 0, total_spend: 0, avg_fulfillment_days: 0 }),
    }));

    const context = JSON.stringify({ vendors: vendorData });

    const systemInstruction = `You are an AI Vendor Performance analyst for a furniture manufacturing ERP.
Evaluate vendor reliability, lead times, and fulfillment rates.
Return ONLY valid JSON matching this exact schema:
{
  "vendor_rankings": [{ "id": "uuid", "name": "str", "score": 0-100, "rating": "EXCELLENT|GOOD|AVERAGE|POOR", "strengths": ["str"], "risks": ["str"], "recommendation": "str" }],
  "top_vendor": "str",
  "at_risk_vendors": ["str"],
  "insights": [{ "message": "str", "severity": "INFO|WARNING|ERROR" }],
  "summary": "str"
}`;

    const prompt = `Analyze vendor performance:\n${context}`;
    return await geminiService.generateStructuredResponse(prompt, systemInstruction);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURE 7: AI CHAT COPILOT
  // ─────────────────────────────────────────────────────────────────────────────
  async processChatPrompt(userMessage) {
    // Fetch all context in parallel to guarantee actual live database data is available for all queries
    const dataPromises = {
      kpis: query(`
        SELECT
          (SELECT COUNT(*) FROM sales_orders WHERE status NOT IN ('CANCELLED')) AS total_sales,
          (SELECT SUM(total_amount) FROM sales_orders WHERE status NOT IN ('CANCELLED')) AS total_revenue,
          (SELECT COUNT(*) FROM sales_orders WHERE status = 'APPROVED') AS pending_sales,
          (SELECT COUNT(*) FROM sales_orders WHERE DATE(created_at) = CURRENT_DATE) AS today_sales,
          (SELECT SUM(total_amount) FROM sales_orders WHERE DATE(created_at) = CURRENT_DATE) AS today_revenue,
          (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('PENDING_APPROVAL', 'APPROVED')) AS pending_pos,
          (SELECT COUNT(*) FROM purchase_orders WHERE created_at + INTERVAL '7 days' < NOW() AND status = 'APPROVED') AS overdue_pos,
          (SELECT COUNT(*) FROM manufacturing_orders WHERE status = 'IN_PRODUCTION') AS active_mos,
          (SELECT COUNT(*) FROM manufacturing_orders WHERE status = 'DRAFT') AS planned_mos,
          (SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.qty_on_hand <= p.reorder_point) AS low_stock_count,
          (SELECT COUNT(*) FROM customers) AS total_customers,
          (SELECT COUNT(*) FROM vendors) AS total_vendors
      `),
      inventory: query(`
        SELECT p.name, p.sku, i.qty_on_hand, p.reorder_point, i.qty_reserved,
               (i.qty_on_hand - i.qty_reserved) AS available, p.unit_price, p.type
        FROM inventory i JOIN products p ON i.product_id = p.id
        ORDER BY p.name ASC
        LIMIT 50
      `),
      purchase_orders: query(`
        SELECT po.order_number, v.name AS vendor, po.status, po.total_amount, po.created_at,
               po.created_at + INTERVAL '7 days' < NOW() AND po.status = 'APPROVED' AS is_overdue
        FROM purchase_orders po
        JOIN vendors v ON po.vendor_id = v.id
        ORDER BY po.created_at DESC
        LIMIT 25
      `),
      sales_orders: query(`
        SELECT so.order_number, c.name AS customer, so.status, so.total_amount, so.created_at
        FROM sales_orders so
        JOIN customers c ON so.customer_id = c.id
        ORDER BY so.created_at DESC
        LIMIT 25
      `),
      manufacturing_orders: query(`
        SELECT mo.mo_number, p.name AS product, mo.status, mo.quantity, mo.created_at
        FROM manufacturing_orders mo
        JOIN products p ON mo.finished_good_id = p.id
        ORDER BY mo.created_at DESC
        LIMIT 25
      `),
      profit_margins: query(`
        SELECT
          p.name AS product,
          p.sku,
          p.unit_cost,
          p.unit_price,
          (p.unit_price - p.unit_cost) AS profit_margin_absolute,
          ROUND(((p.unit_price - p.unit_cost) / NULLIF(p.unit_price, 0)) * 100, 2) AS profit_margin_percent
        FROM products p
        WHERE p.type = 'FINISHED_GOOD'
        ORDER BY profit_margin_percent DESC
      `),
      vendor_lead_times: query(`
        SELECT
          v.name AS vendor,
          p.name AS product,
          vp.vendor_price,
          vp.lead_time_days
        FROM vendor_products vp
        JOIN vendors v ON vp.vendor_id = v.id
        JOIN products p ON vp.product_id = p.id
        ORDER BY v.name, vp.lead_time_days
      `),
      manufacturing_queues: query(`
        SELECT
          mo.mo_number,
          p.name AS product,
          mo.status,
          mo.quantity,
          COUNT(wo.id) AS total_work_orders,
          COUNT(wo.id) FILTER (WHERE wo.status = 'COMPLETED') AS completed_work_orders,
          COUNT(wo.id) FILTER (WHERE wo.status = 'IN_PROGRESS') AS active_work_orders
        FROM manufacturing_orders mo
        JOIN products p ON mo.finished_good_id = p.id
        LEFT JOIN work_orders wo ON mo.id = wo.manufacturing_order_id
        WHERE mo.status IN ('DRAFT', 'APPROVED', 'IN_PRODUCTION')
        GROUP BY mo.id, mo.mo_number, p.name, mo.status, mo.quantity, mo.created_at
        ORDER BY mo.created_at ASC
      `)
    };

    // Resolve all data
    const resolved = {};
    for (const [key, promise] of Object.entries(dataPromises)) {
      const result = await promise;
      resolved[key] = result.rows;
    }

    const systemInstruction = `You are the AI ERP Copilot for Shiv Furniture Works, a furniture manufacturing company.
You have access to live database query results from the ERP system.
Answer the user's question based ONLY on the real data provided — no guesses or invented numbers.
Be concise, professional, and actionable. Use markdown formatting (bold, tables, bullets) for clarity.
If the data does not contain the answer, say so clearly.`;

    const prompt = `User Question: "${userMessage}"

Live ERP Database Data:
${JSON.stringify(resolved, null, 2)}

Answer the question using only the data above. Be specific with numbers.`;

    const response = await geminiService.generateTextResponse(prompt, systemInstruction);
    return { response, timestamp: new Date().toISOString() };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ─────────────────────────────────────────────────────────────────────────────
  async getHealthStatus() {
    // Database check
    let dbStatus = 'ERROR';
    let dbError = null;
    try {
      await query('SELECT 1');
      dbStatus = 'OK';
    } catch (err) {
      dbError = err.message;
    }

    // Gemini check
    const geminiConfigured = geminiService.isConfigured();
    let geminiStatus = 'NOT_CONFIGURED';
    let geminiError = null;

    if (geminiConfigured) {
      const alive = await geminiService.ping();
      geminiStatus = alive ? 'OK' : 'ERROR';
      if (!alive) {
        geminiError = 'Gemini ping failed — check GEMINI_API_KEY validity.';
      }
    } else {
      geminiError = 'GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey and add it to backend/.env';
    }

    return {
      timestamp: new Date().toISOString(),
      database: { status: dbStatus, error: dbError },
      gemini: {
        status: geminiStatus,
        model: geminiService.getModelName(),
        configured: geminiConfigured,
        error: geminiError,
      },
      groq: {
        status: geminiStatus,
        model: geminiService.getModelName(),
        configured: geminiConfigured,
        error: geminiError,
      },
      overall: dbStatus === 'OK' && geminiStatus === 'OK' ? 'HEALTHY' : 'DEGRADED',
    };
  }
}

module.exports = new AiService();
