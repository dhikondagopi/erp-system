const dashboardRepository = require('../repositories/dashboardRepository');
const vendorService = require('./vendorService');

/**
 * Dashboard Analytics Service.
 * Aggregates results across repository queries to build structural analytics payloads.
 */
class DashboardService {
  /**
   * Aggregate stats for dashboard KPIs, top selling tables, and recent stock changes.
   */
  async getDashboardSummary() {
    const [
      revenueToday,
      revenueThisMonth,
      inventoryValuation,
      lowStockCount,
      pendingPO,
      pendingMO,
      topSellers,
      recentMovements,
      monthlyRevenueTrend,
      manufacturingStatusDist,
      purchaseTrend,
      topCustomers,
      topVendors,
      inventoryValuationByCategory,
      
      // New Executive KPIs
      profit,
      inventoryTurnover,
      manufacturingEfficiency,
      orderFulfillmentRate,
      customerGrowth,
      monthlyProductionTrend,
      vendorOverview
    ] = await Promise.all([
      dashboardRepository.getRevenueToday(),
      dashboardRepository.getRevenueThisMonth(),
      dashboardRepository.getInventoryValuation(),
      dashboardRepository.getLowStockCount(),
      dashboardRepository.getPendingPurchaseOrdersCount(),
      dashboardRepository.getPendingManufacturingOrdersCount(),
      dashboardRepository.getTopSellingProducts(5),
      dashboardRepository.getRecentLedgerMovements(10),
      dashboardRepository.getMonthlyRevenueTrend(6),
      dashboardRepository.getManufacturingStatusDistribution(),
      dashboardRepository.getPurchaseTrend(6),
      dashboardRepository.getTopCustomers(5),
      dashboardRepository.getTopVendors(5),
      dashboardRepository.getInventoryValuationByCategory(),
      
      // New Executive KPIs
      dashboardRepository.getProfit(),
      dashboardRepository.getInventoryTurnover(),
      dashboardRepository.getManufacturingEfficiency(),
      dashboardRepository.getOrderFulfillmentRate(),
      dashboardRepository.getCustomerGrowth(),
      dashboardRepository.getMonthlyProductionTrend(6),
      vendorService.getPerformanceOverview()
    ]);

    // Calculate average vendor performance score
    const activeScorecards = vendorOverview.all_vendors.filter(v => v.total_orders > 0);
    const avgVendorPerformance = activeScorecards.length > 0
      ? Math.round(activeScorecards.reduce((sum, v) => sum + v.performance_score, 0) / activeScorecards.length)
      : 100; // Default to 100 if no data

    return {
      kpis: {
        revenue_today: revenueToday,
        revenue_month: revenueThisMonth,
        inventory_value: inventoryValuation,
        low_stock_products_count: lowStockCount,
        pending_purchase_orders_count: pendingPO,
        pending_manufacturing_orders_count: pendingMO,
        
        // New Executive KPIs
        profit,
        inventory_turnover: inventoryTurnover,
        manufacturing_efficiency: manufacturingEfficiency,
        order_fulfillment_rate: orderFulfillmentRate,
        vendor_performance: avgVendorPerformance,
        customer_growth: customerGrowth
      },
      top_selling_products: topSellers,
      recent_inventory_movements: recentMovements,
      monthly_revenue_trend: monthlyRevenueTrend,
      manufacturing_status_distribution: manufacturingStatusDist,
      purchase_trend: purchaseTrend,
      top_customers: topCustomers,
      top_vendors: topVendors,
      inventory_valuation_by_category: inventoryValuationByCategory,
      monthly_production_trend: monthlyProductionTrend,
      best_vendors: vendorOverview.best_vendors,
      worst_vendors: vendorOverview.worst_vendors
    };
  }
}

module.exports = new DashboardService();
