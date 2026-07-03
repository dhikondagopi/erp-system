import React from 'react';
import { 
  BarChart2, 
  RefreshCw, 
  Wifi, 
  TrendingUp, 
  RefreshCcw, 
  Factory, 
  CheckCircle2, 
  Users, 
  Truck, 
  TrendingDown, 
  Star 
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboard';
import KPICards from '../components/KPICards';
import AiInsightsWidget from '../../../modules/ai/components/AiInsightsWidget';
import AiForecastingPanel from '../../../modules/ai/components/AiForecastingPanel';
import RevenueChart from '../components/RevenueChart';
import TopSellersChart from '../components/TopSellersChart';
import ProductionVolumeChart from '../components/ProductionVolumeChart';
import ManufacturingChart from '../components/ManufacturingChart';
import ActivityFeed from '../components/ActivityFeed';
import InventoryValueCard from '../components/InventoryValueCard';
import PartnerAnalytics from '../components/PartnerAnalytics';
import InventoryValuationChart from '../components/InventoryValuationChart';

const formatCurrency = (n) =>
  n >= 1_000_000
    ? `₹${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `₹${(n / 1_000).toFixed(1)}K`
    : `₹${Number(n).toFixed(2)}`;

/**
 * DashboardPage — Advanced ERP Analytics Dashboard.
 * Displays real-time KPIs, sales, inventory valuation, partner performance, and manufacturing.
 */
const DashboardPage = () => {
  const { data, isLoading, isFetching, isError, refetch, dataUpdatedAt } = useDashboardStats();

  const kpis = data?.kpis || {};
  const topSellers = data?.top_selling_products || [];
  const recentMovements = data?.recent_inventory_movements || [];
  const monthlyRevenue = data?.monthly_revenue_trend || [];
  const mfgDistribution = data?.manufacturing_status_distribution || [];
  const purchaseTrend = data?.purchase_trend || [];
  const topCustomers = data?.top_customers || [];
  const topVendors = data?.top_vendors || [];
  const inventoryValuationByCategory = data?.inventory_valuation_by_category || [];
  
  // New Executive Data
  const monthlyProduction = data?.monthly_production_trend || [];
  const bestVendors = data?.best_vendors || [];
  const worstVendors = data?.worst_vendors || [];

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <BarChart2 className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Business Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-14">
            Real-time corporate KPIs, billing summaries, inventory valuations, and manufacturing metrics.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              Updated {lastUpdated}
            </div>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 flex items-center justify-between">
          <p className="text-red-400 text-sm font-medium">
            Failed to load dashboard statistics.
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs text-red-300 hover:text-white underline transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Section: AI Insights */}
      <section>
        <AiInsightsWidget />
      </section>

      {/* Section 1: Standard KPI Cards */}
      <section className="space-y-2">
        <SectionLabel>Operational Health KPIs</SectionLabel>
        <KPICards kpis={kpis} loading={isLoading} />
      </section>

      {/* Section 2: Executive Performance KPIs */}
      <section className="space-y-2">
        <SectionLabel>Executive Financial & Fulfillment KPIs</SectionLabel>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Profit */}
            <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Profit</span>
                <TrendingUp className="h-4 w-4 text-violet-400" />
              </div>
              <h4 className="text-xl font-black text-white mt-3">{formatCurrency(kpis.profit || 0)}</h4>
              <span className="text-[9px] text-slate-500 mt-1">Direct sales margin</span>
            </div>

            {/* Turnover */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Turnover</span>
                <RefreshCcw className="h-4 w-4 text-cyan-400" />
              </div>
              <h4 className="text-xl font-black text-white mt-3">x{(kpis.inventory_turnover || 0.00).toFixed(2)}</h4>
              <span className="text-[9px] text-slate-500 mt-1">COGS / Inventory Value</span>
            </div>

            {/* Mfg Efficiency */}
            <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mfg Efficiency</span>
                <Factory className="h-4 w-4 text-emerald-400" />
              </div>
              <h4 className="text-xl font-black text-white mt-3">{(kpis.manufacturing_efficiency || 0.00).toFixed(1)}%</h4>
              <span className="text-[9px] text-slate-500 mt-1">MO Completion rate</span>
            </div>

            {/* Fulfillment */}
            <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Rate</span>
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
              </div>
              <h4 className="text-xl font-black text-white mt-3">{(kpis.order_fulfillment_rate || 0.00).toFixed(1)}%</h4>
              <span className="text-[9px] text-slate-500 mt-1">SO Dispatch completion</span>
            </div>

            {/* Vendor Score */}
            <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Score</span>
                <Truck className="h-4 w-4 text-amber-400" />
              </div>
              <h4 className="text-xl font-black text-white mt-3">{kpis.vendor_performance || 100} / 100</h4>
              <span className="text-[9px] text-slate-500 mt-1">Avg Lead & On-Time Rating</span>
            </div>

            {/* Customers */}
            <div className="bg-gradient-to-br from-rose-600/10 to-red-600/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customers</span>
                <Users className="h-4 w-4 text-rose-455" />
              </div>
              <h4 className="text-xl font-black text-white mt-3">{kpis.customer_growth || 0}</h4>
              <span className="text-[9px] text-slate-500 mt-1">Registered accounts count</span>
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Financial Charts & Production Volume */}
      <section className="space-y-2">
        <SectionLabel>Sales, Cost & Production Volume</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-3">
            <RevenueChart revenueData={monthlyRevenue} purchaseData={purchaseTrend} loading={isLoading} />
          </div>
          <div className="lg:col-span-3">
            <ProductionVolumeChart data={monthlyProduction} loading={isLoading} />
          </div>
        </div>
      </section>

      {/* Section: Partner Performance & AI Vendor Recommendations */}
      <section className="space-y-2">
        <SectionLabel>Partner Performance & Supplier Diagnostics</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-4">
            <PartnerAnalytics customers={topCustomers} vendors={topVendors} loading={isLoading} />
          </div>

          {/* Supplier Rankings Card (Best/Worst Vendors) */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg h-full flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Star className="text-amber-400 h-4.5 w-4.5 fill-amber-400" />
                  Supplier Rankings
                </h4>
                <p className="text-slate-500 text-xs">Based on actual lead times and quality</p>
              </div>

              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-10 bg-slate-800/40 rounded-lg" />
                  ))}
                </div>
              ) : bestVendors.length === 0 && worstVendors.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Insufficient PO history to compute supplier rankings.
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {bestVendors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-emerald-450 uppercase tracking-widest block">Top Performers (Score ≥ 80)</span>
                      {bestVendors.map((v) => (
                        <div key={v.vendor_id} className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-lg text-xs">
                          <span className="text-slate-200 font-medium">{v.vendor_name}</span>
                          <span className="font-bold text-emerald-400">{v.performance_score}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {worstVendors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-rose-455 uppercase tracking-widest block">Requires Review (Score &lt; 70)</span>
                      {worstVendors.map((v) => (
                        <div key={v.vendor_id} className="flex justify-between items-center bg-rose-500/5 border border-rose-500/10 px-3 py-1.5 rounded-lg text-xs">
                          <span className="text-slate-200 font-medium">{v.vendor_name}</span>
                          <span className="font-bold text-rose-400">{v.performance_score}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Inventory Health */}
      <section className="space-y-2">
        <SectionLabel>Inventory Valuations</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <InventoryValueCard kpis={kpis} loading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <InventoryValuationChart data={inventoryValuationByCategory} loading={isLoading} />
          </div>
        </div>
      </section>

      {/* Section 5: Manufacturing Status */}
      <section className="space-y-2">
        <SectionLabel>Manufacturing Queue</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <ManufacturingChart data={mfgDistribution} loading={isLoading} />
          </div>
          <div className="lg:col-span-3">
            <AiForecastingPanel />
          </div>
        </div>
      </section>

      {/* Section 6: Recent Activity & Top Sellers */}
      <section className="space-y-2">
        <SectionLabel>Recent Physical Activity & Products</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ActivityFeed movements={recentMovements} loading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <TopSellersChart data={topSellers} loading={isLoading} />
          </div>
        </div>
      </section>
    </div>
  );
};

/** Small section divider label */
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 pt-2">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{children}</p>
    <div className="flex-1 h-px bg-slate-800/80" />
  </div>
);

export default DashboardPage;
