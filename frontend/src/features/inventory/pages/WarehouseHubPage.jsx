import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Warehouse, 
  Plus, 
  MapPin, 
  Activity, 
  DollarSign, 
  Layers, 
  Edit3, 
  Slash, 
  CheckCircle, 
  Search, 
  ChevronRight, 
  AlertTriangle,
  Boxes
} from 'lucide-react';

const WarehouseHubPage = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['Admin', 'Inventory Manager']);

  // State Management
  const [warehouses, setWarehouses] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, activeCount: 0, totalValuation: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Warehouse Stock Summary
  const [selectedWh, setSelectedWh] = useState(null);
  const [stockSummary, setStockSummary] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [selectedWhForEdit, setSelectedWhForEdit] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '', is_active: true });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Initial Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [whRes, statsRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/warehouses/analytics/overview')
      ]);
      setWarehouses(whRes.data.data.warehouses || []);
      setStats(statsRes.data.data || { totalCount: 0, activeCount: 0, totalValuation: 0 });
      
      // Auto-select first warehouse if available and none selected yet
      const whList = whRes.data.data.warehouses || [];
      if (whList.length > 0 && !selectedWh) {
        setSelectedWh(whList[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve warehouse profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Stock Summary when Selected Warehouse changes
  useEffect(() => {
    if (!selectedWh) return;

    const fetchStock = async () => {
      setStockLoading(true);
      try {
        const res = await api.get(`/warehouses/${selectedWh.id}/stock`);
        setStockSummary(res.data.data || []);
      } catch (err) {
        console.error('Failed to load stock summary:', err);
      } finally {
        setStockLoading(false);
      }
    };

    fetchStock();
  }, [selectedWh]);

  // Handle Create / Edit submissions
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (modalMode === 'CREATE') {
        await api.post('/warehouses', formData);
      } else {
        await api.put(`/warehouses/${selectedWhForEdit.id}`, formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Action failed. Check fields validation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setFormData({ name: '', code: '', address: '', is_active: true });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (wh) => {
    setModalMode('EDIT');
    setSelectedWhForEdit(wh);
    setFormData({ name: wh.name, code: wh.code, address: wh.address || '', is_active: wh.is_active });
    setFormError(null);
    setModalOpen(true);
  };

  const toggleStatus = async (wh) => {
    try {
      const endpoint = wh.is_active ? `/warehouses/${wh.id}/disable` : `/warehouses/${wh.id}/enable`;
      await api.put(endpoint);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Status transition failed.');
    }
  };

  const filteredStock = stockSummary.filter(item => 
    item.product_sku.toLowerCase().includes(stockSearch.toLowerCase()) ||
    item.product_name.toLowerCase().includes(stockSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Warehouse className="text-cyan-400 h-8 w-8" />
            Warehouse Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage corporate storage facilities, track locations, and view physical inventory distributions.
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Create Warehouse
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Warehouses</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalCount || 0}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Warehouse className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Warehouses</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.activeCount || 0}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Valuation</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">
                Rs {new Intl.NumberFormat('en-IN').format(stats.totalValuation || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Warehouse List (Left) & Selected Stock Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Warehouse Master Profile */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-xl p-4 shadow-md">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              Facility Profiles
            </h2>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No warehouses registered yet.</div>
            ) : (
              <div className="space-y-3">
                {warehouses.map((wh) => (
                  <div
                    key={wh.id}
                    onClick={() => setSelectedWh(wh)}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3 ${
                      selectedWh?.id === wh.id
                        ? 'bg-slate-800/50 border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                        : 'bg-slate-900/20 border-slate-800/80 hover:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{wh.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {wh.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {wh.address || 'No address specified.'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        wh.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {wh.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-800/60 pt-3 text-xs">
                      <div className="text-slate-400">
                        Value: <span className="text-white font-medium">Rs {new Intl.NumberFormat('en-IN').format(wh.valuation || 0)}</span>
                      </div>
                      
                      {canManage && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(wh)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                            title="Edit Warehouse"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleStatus(wh)}
                            className={`p-1 rounded transition ${
                              wh.is_active
                                ? 'hover:bg-red-500/10 text-red-400/80 hover:text-red-400'
                                : 'hover:bg-emerald-500/10 text-emerald-400/80 hover:text-emerald-400'
                            }`}
                            title={wh.is_active ? 'Disable Warehouse' : 'Enable Warehouse'}
                          >
                            {wh.is_active ? <Slash className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Selected Warehouse Stock Summary */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-xl p-5 shadow-md h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-blue-400" />
                  Stock Summary: {selectedWh ? selectedWh.name : 'Select facility'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed product quantities and valuations stored in this facility.
                </p>
              </div>

              {selectedWh && (
                <div className="relative w-full sm:w-48">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search stock..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/20">
              {stockLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  <span className="text-xs text-slate-500">Loading stock details...</span>
                </div>
              ) : !selectedWh ? (
                <div className="text-center text-slate-500 py-20 text-sm">
                  Select a warehouse on the left to see its inventory summary.
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="text-center text-slate-500 py-20 text-sm">
                  {stockSearch ? 'No items matching filter query.' : 'This warehouse has no items in stock.'}
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Qty On Hand</th>
                      <th className="px-4 py-3 text-right">Avg Unit Cost</th>
                      <th className="px-4 py-3 text-right">Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-300">
                    {filteredStock.map((item) => (
                      <tr key={item.product_id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-cyan-400">{item.product_sku}</td>
                        <td className="px-4 py-3 font-medium text-white">{item.product_name}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`${parseFloat(item.qty_on_hand) < parseFloat(item.reorder_point || 0) ? 'text-rose-400 font-semibold' : 'text-slate-200'}`}>
                            {parseFloat(item.qty_on_hand)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">Rs {parseFloat(item.unit_cost).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          Rs {new Intl.NumberFormat('en-IN').format(Math.round(item.valuation))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-cyan-400" />
                {modalMode === 'CREATE' ? 'Register New Facility' : `Edit ${selectedWhForEdit?.name}`}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition rounded p-1 hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Raw Material Storage"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Unique Code (Short Code) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'EDIT'}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '-') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-55"
                    placeholder="e.g. WH-RMAT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Physical Address
                  </label>
                  <textarea
                    rows="3"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    placeholder="Physical location coordinate address"
                  />
                </div>

                {modalMode === 'EDIT' && (
                  <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-850 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <label htmlFor="is_active" className="text-xs font-medium text-slate-300 cursor-pointer">
                      Warehouse is operational and active.
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : modalMode === 'CREATE' ? 'Register Facility' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseHubPage;
