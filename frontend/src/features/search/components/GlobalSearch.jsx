import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Truck, Package, User, Clipboard, Layers, Activity, Loader2, X } from 'lucide-react';
import api from '../../../services/api';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close search dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(response.data.data);
        setIsOpen(true);
      } catch (err) {
        console.error('Global search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleItemClick = (path) => {
    navigate(path);
    setQuery('');
    setIsOpen(false);
  };

  const getCategoryConfig = () => {
    if (!results) return [];

    return [
      {
        id: 'products',
        label: 'Products',
        icon: Package,
        items: results.products.map(p => ({
          id: p.id,
          title: `${p.name} (${p.sku})`,
          subtitle: `Category: ${p.category} | Price: ₹${parseFloat(p.unit_price).toLocaleString()}`,
          path: `/products/edit/${p.id}`
        }))
      },
      {
        id: 'sales_orders',
        label: 'Sales Orders',
        icon: ShoppingBag,
        items: results.sales_orders.map(s => ({
          id: s.id,
          title: `Sales Order ${s.order_number}`,
          subtitle: `Customer: ${s.customer_name} | Amount: ₹${parseFloat(s.total_amount).toLocaleString()} | Status: ${s.status}`,
          path: `/sales-orders/${s.id}`
        }))
      },
      {
        id: 'purchase_orders',
        label: 'Purchase Orders',
        icon: Truck,
        items: results.purchase_orders.map(p => ({
          id: p.id,
          title: `Purchase Order ${p.order_number}`,
          subtitle: `Vendor: ${p.vendor_name} | Amount: ₹${parseFloat(p.total_amount).toLocaleString()} | Status: ${p.status}`,
          path: `/purchase-orders/${p.id}`
        }))
      },
      {
        id: 'manufacturing_orders',
        label: 'Mfg Orders',
        icon: Layers,
        items: results.manufacturing_orders.map(m => ({
          id: m.id,
          title: `Manufacturing Order ${m.mo_number}`,
          subtitle: `Product: ${m.product_name} | Qty: ${m.quantity} | Status: ${m.status}`,
          path: `/manufacturing-orders`
        }))
      },
      {
        id: 'work_orders',
        label: 'Work Orders',
        icon: Clipboard,
        items: results.work_orders.map(w => ({
          id: w.id,
          title: `Work Order: ${w.operation_name}`,
          subtitle: `MO: ${w.mo_number} | Status: ${w.status}`,
          path: `/work-orders`
        }))
      },
      {
        id: 'customers',
        label: 'Customers',
        icon: User,
        items: results.customers.map(c => ({
          id: c.id,
          title: c.name,
          subtitle: `Email: ${c.email} | Phone: ${c.phone}`,
          path: `/customers/edit/${c.id}`
        }))
      },
      {
        id: 'vendors',
        label: 'Vendors',
        icon: Truck,
        items: results.vendors.map(v => ({
          id: v.id,
          title: v.name,
          subtitle: `Email: ${v.email} | Phone: ${v.phone}`,
          path: `/vendors/edit/${v.id}`
        }))
      }
    ].filter(cat => cat.items.length > 0);
  };

  const categories = getCategoryConfig();
  const totalCount = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="relative w-72 md:w-96" ref={searchRef}>
      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Global search (products, orders, partners)..."
          className="w-full h-9.5 pl-10 pr-9.5 rounded-lg border border-slate-800 bg-slate-950 text-xs font-medium text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-slate-500" />
          )}
        </div>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Grouped Results Popover */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute left-0 mt-2.5 w-full rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
          {/* Category filter tabs */}
          {results && totalCount > 0 && (
            <div className="flex border-b border-slate-800/80 bg-slate-950/20 px-2 py-1.5 gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  activeCategory === 'all'
                    ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                All ({totalCount})
              </button>
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      activeCategory === cat.id
                        ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {cat.label} ({cat.items.length})
                  </button>
                );
              })}
            </div>
          )}

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-3">
            {loading && !results ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-2" />
                <p className="text-[11px] text-slate-500 font-medium">Searching resources...</p>
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <p className="text-[11px] text-slate-500 font-semibold">No matches found for "{query}"</p>
              </div>
            ) : (
              categories
                .filter(cat => activeCategory === 'all' || activeCategory === cat.id)
                .map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.id} className="space-y-1">
                      {activeCategory === 'all' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5">
                          <Icon className="h-3 w-3 text-slate-500" />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            {cat.label}
                          </span>
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {cat.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item.path)}
                            className="w-full text-left p-2 rounded-lg hover:bg-slate-800/40 border border-transparent hover:border-slate-800/30 transition-all flex flex-col gap-0.5"
                          >
                            <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium line-clamp-1">
                              {item.subtitle}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
