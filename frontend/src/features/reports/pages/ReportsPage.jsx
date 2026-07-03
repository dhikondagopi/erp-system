import React, { useState, useEffect } from 'react';
import {
  FileText, Filter, Download, RefreshCw, AlertCircle,
  TrendingUp, ShoppingCart, Archive, Briefcase, Users, Truck
} from 'lucide-react';
import api from '../../../services/api';

const REPORTS = [
  { id: 'sales', name: 'Sales Orders', desc: 'Summary of client sales invoices and margins', icon: TrendingUp },
  { id: 'purchases', name: 'Purchase Orders', desc: 'Summary of supplier costs and vendor spends', icon: ShoppingCart },
  { id: 'inventory', name: 'Inventory Levels', desc: 'Valuations, storage quantities, and locations', icon: Archive },
  { id: 'manufacturing', name: 'Manufacturing Performance', desc: 'Production quantities, queue efficiency, and times', icon: Briefcase },
  { id: 'customers', name: 'Customers Summary', desc: 'Revenue analysis and completed order rankings', icon: Users },
  { id: 'vendors', name: 'Vendors Summary', desc: 'Supplier order fulfillment and total spends', icon: Truck }
];

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load preview data
  const fetchReportPreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;
      params.format = 'json';

      const response = await api.get(`/reports/${selectedReport}`, { params });
      setData(response.data.data.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report preview.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run search when report selection or filters change
  useEffect(() => {
    fetchReportPreview();
  }, [selectedReport]);

  const handleDownload = (format) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);
    params.append('format', format);
    
    // Get authorization token to pass if necessary, but window.open might not support headers.
    // However, the backend endpoint authenticates. How can we download with Auth headers?
    // We can fetch as a blob, and trigger standard browser save! That is the standard, secure React way!
    triggerBlobDownload(format, params);
  };

  const triggerBlobDownload = async (format, params) => {
    try {
      const response = await api.get(`/reports/${selectedReport}`, {
        params,
        responseType: 'blob'
      });
      
      const fileExtensions = { csv: 'csv', excel: 'xls', pdf: 'pdf' };
      const contentTypes = {
        csv: 'text/csv',
        excel: 'application/vnd.ms-excel',
        pdf: 'application/pdf'
      };

      const blob = new Blob([response.data], { type: contentTypes[format] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.${fileExtensions[format]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report file: ' + err.message);
    }
  };

  // Headers helper matching reportsService
  const getReportHeaders = () => {
    const maps = {
      sales: ['Order #', 'Customer', 'Status', 'Order Date', 'Items', 'Total Amount'],
      purchases: ['Order #', 'Vendor', 'Status', 'Order Date', 'Items', 'Total Amount'],
      inventory: ['Product Name', 'SKU', 'Type', 'Qty On Hand', 'Qty Reserved', 'Unit Cost', 'Total Valuation', 'Location'],
      manufacturing: ['MO #', 'Product', 'Quantity', 'Status', 'Start Date', 'Completion Date', 'Duration (Days)'],
      customers: ['Customer Name', 'Email', 'Phone', 'Orders Completed', 'Total Spend'],
      vendors: ['Vendor Name', 'Email', 'Phone', 'Orders Fulfilled', 'Total Cost']
    };
    return maps[selectedReport] || [];
  };

  const getReportKeys = () => {
    const maps = {
      sales: ['order_number', 'customer_name', 'status', 'order_date', 'items_count', 'total_amount'],
      purchases: ['order_number', 'vendor_name', 'status', 'order_date', 'items_count', 'total_amount'],
      inventory: ['product_name', 'sku', 'type', 'qty_on_hand', 'qty_reserved', 'unit_cost', 'total_valuation', 'location'],
      manufacturing: ['mo_number', 'product_name', 'quantity', 'status', 'start_date', 'completion_date', 'duration_days'],
      customers: ['customer_name', 'email', 'phone', 'total_orders', 'total_spend'],
      vendors: ['vendor_name', 'email', 'phone', 'total_orders', 'total_spend']
    };
    return maps[selectedReport] || [];
  };

  const formatCell = (val, key) => {
    if (val === null || val === undefined) return '-';
    if (['total_amount', 'unit_cost', 'total_valuation', 'total_spend'].includes(key)) {
      return `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    if (['order_date', 'start_date', 'completion_date'].includes(key)) {
      return new Date(val).toLocaleDateString('en-IN');
    }
    return val.toString();
  };

  const activeReportInfo = REPORTS.find(r => r.id === selectedReport);
  const IconComponent = activeReportInfo?.icon || FileText;

  // Status lists for filters
  const showStatusFilter = ['sales', 'purchases', 'manufacturing'].includes(selectedReport);
  const getStatusOptions = () => {
    if (selectedReport === 'sales') {
      return ['DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED'];
    }
    if (selectedReport === 'purchases') {
      return ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RECEIVED', 'CANCELLED'];
    }
    if (selectedReport === 'manufacturing') {
      return ['DRAFT', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'];
    }
    return [];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Reports Engine</h1>
        <p className="text-slate-400 font-medium">Export custom tabular reports and logs in PDF, Excel, or CSV format.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Side Navigation Cards */}
        <div className="space-y-3 lg:col-span-1">
          {REPORTS.map((report) => {
            const CurrentIcon = report.icon;
            const isSelected = selectedReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => {
                  setSelectedReport(report.id);
                  setStartDate('');
                  setEndDate('');
                  setStatus('');
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-955/25 border-blue-800 text-white'
                    : 'bg-slate-955/20 border-slate-900 text-slate-400 hover:bg-slate-950/40 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                    <CurrentIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">{report.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{report.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side Report Filter & Table Preview */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters Bar */}
          <div className="rounded-xl border border-slate-900 bg-slate-955/30 p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
              <Filter className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Filters</h3>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              {showStatusFilter && (
                <div className="flex-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Status Filter</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    {getStatusOptions().map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={fetchReportPreview}
                  disabled={isLoading}
                  className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Update Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Export & Preview */}
          <div className="rounded-xl border border-slate-900 bg-slate-955/30 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-900/20 text-blue-400">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">{activeReportInfo?.name}</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Previewing first 50 rows matches filters</p>
                </div>
              </div>

              {/* Export Downloads */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleDownload('pdf')}
                  disabled={isLoading || data.length === 0}
                  className="flex items-center space-x-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-3.5 py-2 shadow-md shadow-blue-900/10 transition-all"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>PDF Document</span>
                </button>
                <button
                  onClick={() => handleDownload('excel')}
                  disabled={isLoading || data.length === 0}
                  className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs px-3.5 py-2 transition-all"
                >
                  <FileText className="h-4.5 w-4.5" />
                  <span>Excel Sheet</span>
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={isLoading || data.length === 0}
                  className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-350 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs px-3.5 py-2 transition-all"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>CSV File</span>
                </button>
              </div>
            </div>

            {/* Table Preview */}
            {isLoading ? (
              <div className="flex h-[300px] flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
                <p className="text-xs text-slate-500 font-semibold">Generating report preview...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-955/30 bg-red-955/10 p-6 flex flex-col items-center text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h4 className="text-xs font-bold text-white">Preview Generation Failed</h4>
                <p className="text-[10px] text-slate-500 max-w-sm">{error}</p>
              </div>
            ) : data.length === 0 ? (
              <div className="rounded-xl border border-slate-900 bg-slate-955/15 p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-300">No matching logs found</h4>
                <p className="text-[10px] text-slate-500 max-w-xs">There are no records in the database matching these specific filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-900">
                <table className="min-w-full divide-y divide-slate-900 text-left">
                  <thead className="bg-slate-950/60 font-semibold text-slate-400 text-xs">
                    <tr>
                      {getReportHeaders().map((header, idx) => (
                        <th key={idx} className="px-6 py-4">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 bg-slate-955/10 text-slate-300 text-xs">
                    {data.slice(0, 50).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-950/40 transition-colors">
                        {getReportKeys().map((key, keyIdx) => (
                          <td key={keyIdx} className="px-6 py-3.5 font-medium">
                            {formatCell(row[key], key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
