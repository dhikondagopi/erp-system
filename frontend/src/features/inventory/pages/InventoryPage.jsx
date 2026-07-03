import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInventoryQuery, useStockLedgerQuery, useAdjustStockMutation } from '../hooks/useInventory';
import { Boxes, History, Search, X, Layers, AlertTriangle, Sparkles } from 'lucide-react';
import InventorySummaryCards from '../components/InventorySummaryCards';
import InventoryTable from '../components/InventoryTable';
import StockLedgerTable from '../components/StockLedgerTable';
import AiInventoryInsightsPanel from '../../../modules/ai/components/AiInventoryInsightsPanel';
import StockAdjustmentModal from '../components/StockAdjustmentModal';

const InventoryPage = () => {
  const { hasRole } = useAuth();
  const canAdjust = hasRole(['Admin', 'Inventory Manager']);

  const [activeTab, setActiveTab] = useState('levels'); // 'levels' | 'ledger'

  // Levels States
  const [levelsSearch, setLevelsSearch] = useState('');
  const [debouncedLevelsSearch, setDebouncedLevelsSearch] = useState('');
  const [levelsLocation, setLevelsLocation] = useState('');
  const [levelsPage, setLevelsPage] = useState(1);

  // Ledger States
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [debouncedLedgerSearch, setDebouncedLedgerSearch] = useState('');
  const [ledgerType, setLedgerType] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);

  // Adjustment Modal States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState(null);

  // Debounces
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLevelsSearch(levelsSearch);
      setLevelsPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [levelsSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLedgerSearch(ledgerSearch);
      setLedgerPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [ledgerSearch]);

  // Queries
  const { 
    data: levelsData, 
    isLoading: isLevelsLoading, 
    error: levelsError 
  } = useInventoryQuery({
    search: debouncedLevelsSearch,
    location: levelsLocation,
    page: levelsPage,
    limit: 15
  });

  const { 
    data: ledgerData, 
    isLoading: isLedgerLoading, 
    error: ledgerError 
  } = useStockLedgerQuery({
    search: debouncedLedgerSearch,
    transaction_type: ledgerType,
    page: ledgerPage,
    limit: 15
  });

  const adjustMutation = useAdjustStockMutation();

  const handleOpenAdjustment = (product) => {
    setSelectedProduct(product);
    setAdjustmentError(null);
    setAdjustmentOpen(true);
  };

  const handleConfirmAdjustment = async (adjustmentData) => {
    setAdjustmentError(null);
    try {
      await adjustMutation.mutateAsync(adjustmentData);
      setAdjustmentOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setAdjustmentError(err.response?.data?.message || 'Stock adjustment failed. Please check validation limits.');
    }
  };

  const handleExportCSV = () => {
    if (!ledgerData || !ledgerData.history || ledgerData.history.length === 0) {
      alert('No ledger entries available to export.');
      return;
    }
    
    const headers = ['Timestamp', 'SKU', 'Product Name', 'Transaction Type', 'Warehouse', 'Prev Qty', 'Qty Changed', 'New Qty', 'Unit Cost', 'Operator', 'Ref Number', 'Remarks'];
    
    const rows = ledgerData.history.map(entry => [
      new Date(entry.created_at).toLocaleString(),
      entry.product_sku || '',
      entry.product_name || '',
      entry.transaction_type || '',
      entry.location || 'Main Warehouse',
      entry.qty_previous || 0,
      entry.qty_change || 0,
      entry.qty_new || 0,
      entry.unit_cost || 0,
      entry.first_name ? `${entry.first_name} ${entry.last_name}` : 'System Engine',
      entry.reference_number || (entry.reference_type ? `${entry.reference_type} (${entry.reference_id})` : 'Manual'),
      entry.reason || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Ledger_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Title Header */}
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Stock Directory</h1>
        <p className="text-slate-400 font-medium">Verify current inventory statuses, physical balances, and transaction history logs.</p>
      </div>

      {/* Tabs Selector Navigation Header */}
      <div className="flex border-b border-slate-900 bg-slate-955/20 backdrop-blur-md p-1 rounded-xl w-fit border">
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'levels'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-md shadow-blue-900/5'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Boxes className="h-4.5 w-4.5" />
          <span>Stock Levels</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'ledger'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-md shadow-blue-900/5'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <History className="h-4.5 w-4.5" />
          <span>Stock Ledger</span>
        </button>
        <button
          onClick={() => setActiveTab('ai-insights')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'ai-insights'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-md shadow-blue-900/5'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 text-violet-450 animate-pulse" />
          <span>AI Inventory Insights</span>
        </button>
      </div>

      {/* 1. STOCK LEVELS VIEW */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {levelsData && <InventorySummaryCards items={levelsData.inventory} />}

          {/* Levels Filter Options */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search levels by SKU or Product Name..."
                value={levelsSearch}
                onChange={(e) => setLevelsSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none transition-all"
              />
              {levelsSearch && (
                <button
                  onClick={() => setLevelsSearch('')}
                  className="absolute right-3 top-2.5 flex h-5.5 w-5.5 items-center justify-center rounded-md text-slate-500 hover:text-slate-350"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Location selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Location</span>
              <select
                value={levelsLocation}
                onChange={(e) => { setLevelsLocation(e.target.value); setLevelsPage(1); }}
                className="rounded-lg border border-slate-800 bg-slate-955 px-3 py-2 text-xs font-semibold text-slate-355 focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Warehouses</option>
                <option value="Main Warehouse">Main Warehouse</option>
              </select>
            </div>
          </div>

          {/* Data loading and listing rendering */}
          {levelsError && (
            <div className="rounded-xl border border-red-955/40 bg-red-955/20 p-6 text-center max-w-lg mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-400">Failed to load inventory levels</h3>
              <p className="text-xs text-slate-450 mt-2">Validate network connectivity and reload request.</p>
            </div>
          )}

          {isLevelsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading stock levels...</p>
            </div>
          ) : levelsData?.inventory?.length === 0 ? (
            <div className="rounded-xl border border-slate-900 bg-slate-950/20 py-20 text-center text-slate-500 font-medium">
              No inventory records match filters.
            </div>
          ) : levelsData ? (
            <div className="space-y-6">
              <InventoryTable
                items={levelsData.inventory}
                onAdjust={handleOpenAdjustment}
                canAdjust={canAdjust}
              />

              {/* Levels Pagination */}
              {levelsData.pagination && levelsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-5 text-xs text-slate-500 font-semibold">
                  <p>Page {levelsData.pagination.currentPage} of {levelsData.pagination.totalPages}</p>
                  <div className="flex space-x-2">
                    <button
                      disabled={levelsPage <= 1}
                      onClick={() => setLevelsPage(p => p - 1)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-900 hover:text-slate-200 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={levelsPage >= levelsData.pagination.totalPages}
                      onClick={() => setLevelsPage(p => p + 1)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-900 hover:text-slate-200 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 2. STOCK LEDGER VIEW */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Ledger Filter Options */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search ledger by SKU, Product Name, or Reason..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none"
              />
              {ledgerSearch && (
                <button
                  onClick={() => setLedgerSearch('')}
                  className="absolute right-3 top-2.5 flex h-5.5 w-5.5 items-center justify-center rounded-md text-slate-500 hover:text-slate-350"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type selector & Export Button */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Layers className="h-4.5 w-4.5 text-slate-500" />
                <select
                  value={ledgerType}
                  onChange={(e) => { setLedgerType(e.target.value); setLedgerPage(1); }}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-355 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">All Movements</option>
                  <option value="RECEIPT">Receipts</option>
                  <option value="ISSUE">Issues</option>
                  <option value="ADJUSTMENT">Adjustments</option>
                  <option value="ALLOCATION">Allocations</option>
                  <option value="DEALLOCATION">Deallocations</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 rounded-lg bg-blue-650 hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 shadow"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Ledger Data loading */}
          {ledgerError && (
            <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-400">Failed to load transaction ledger</h3>
              <p className="text-xs text-slate-450 mt-2">Validate network connectivity and reload request.</p>
            </div>
          )}

          {isLedgerLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading transaction history logs...</p>
            </div>
          ) : ledgerData?.history?.length === 0 ? (
            <div className="rounded-xl border border-slate-900 bg-slate-950/20 py-20 text-center text-slate-500 font-medium">
              No transactions ledger entries found.
            </div>
          ) : ledgerData ? (
            <div className="space-y-6">
              <StockLedgerTable entries={ledgerData.history} />

              {/* Ledger Pagination */}
              {ledgerData.pagination && ledgerData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-5 text-xs text-slate-500 font-semibold">
                  <p>Page {ledgerData.pagination.currentPage} of {ledgerData.pagination.totalPages}</p>
                  <div className="flex space-x-2">
                    <button
                      disabled={ledgerPage <= 1}
                      onClick={() => setLedgerPage(p => p - 1)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-905 hover:text-slate-200 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={ledgerPage >= ledgerData.pagination.totalPages}
                      onClick={() => setLedgerPage(p => p + 1)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-905 hover:text-slate-200 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'ai-insights' && (
        <AiInventoryInsightsPanel />
      )}

      {/* Adjust Stock Form Modal */}
      <StockAdjustmentModal
        isOpen={adjustmentOpen}
        onClose={() => setAdjustmentOpen(false)}
        onSubmit={handleConfirmAdjustment}
        product={selectedProduct}
        isSubmitting={adjustMutation.isLoading}
      />

      {/* Adjustment toast notification error */}
      {adjustmentError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-950/40 bg-red-950/90 backdrop-blur-md p-4 text-xs font-semibold text-red-400 max-w-sm">
          {adjustmentError}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
