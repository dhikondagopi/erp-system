import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import {
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  Circle,
} from 'lucide-react';

import api from '../services/api';
import GlobalSearch from '../features/search/components/GlobalSearch';

const AppLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { user, logout } = useAuth();
  const location = useLocation();

  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const normalizedUser = useMemo(() => {
    if (!user || typeof user !== 'object') {
      return null;
    }

    const firstName = typeof (user.first_name ?? user.firstName) === 'string'
      ? (user.first_name ?? user.firstName)
      : '';

    const lastName = typeof (user.last_name ?? user.lastName) === 'string'
      ? (user.last_name ?? user.lastName)
      : '';

    const fallbackName = typeof user.name === 'string' ? user.name : '';
    const fallbackEmail = typeof user.email === 'string' ? user.email : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
      ...user,
      first_name: firstName,
      last_name: lastName,
      name: fallbackName,
      email: fallbackEmail,
      fullName,
    };
  }, [user]);

  const displayName = useMemo(() => {
    return (
      normalizedUser?.fullName ||
      normalizedUser?.name ||
      normalizedUser?.email ||
      'User'
    );
  }, [normalizedUser]);

  const displayShortName = useMemo(() => {
    const emailPrefix = normalizedUser?.email
      ? normalizedUser.email.split('@')[0]
      : '';

    return (
      normalizedUser?.first_name ||
      normalizedUser?.name ||
      emailPrefix ||
      'User'
    );
  }, [normalizedUser]);

  const userInitial = useMemo(() => {
    const source =
      normalizedUser?.first_name ||
      normalizedUser?.last_name ||
      normalizedUser?.name ||
      normalizedUser?.email ||
      'U';

    return String(source).charAt(0).toUpperCase() || 'U';
  }, [normalizedUser]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      const data = response?.data?.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (!normalizedUser) {
      setNotifications([]);
      return;
    }

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000);

    return () => clearInterval(intervalId);
  }, [normalizedUser, fetchNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification?.read).length;
  }, [notifications]);

  useEffect(() => {
    setMobileSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const markAsRead = async (id) => {
    if (!id) return;

    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification?.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getPageTitle = (pathname) => {
    if (pathname === '/dashboard') return 'Dashboard Metrics';
    if (pathname.startsWith('/products')) return 'Product Catalog';
    if (pathname.startsWith('/inventory')) return 'Stock Directory';
    if (pathname.startsWith('/warehouses')) return 'Warehouse Management';
    if (pathname.startsWith('/transfers')) return 'Stock Transfers';
    if (pathname.startsWith('/customers')) return 'Client Directory';
    if (pathname.startsWith('/vendors')) return 'Vendor Directory';
    if (pathname.startsWith('/sales-orders')) return 'Sales Orders Management';
    if (pathname.startsWith('/purchase-orders')) return 'Purchase Orders Management';
    if (pathname.startsWith('/invoices')) return 'Invoice Management';
    if (pathname.startsWith('/payments')) return 'Payments Management';
    if (pathname.startsWith('/bom')) return 'Bill of Materials (BoM)';
    if (pathname.startsWith('/manufacturing-orders')) return 'Manufacturing Production Orders';
    if (pathname.startsWith('/work-orders')) return 'Operation Work Orders';
    if (pathname.startsWith('/audit-logs')) return 'System Activity Audit Logs';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/ai-copilot')) return 'AI Copilot';
    return 'Enterprise System';
  };

  const renderNotificationIcon = (type) => {
    if (type === 'shortage') {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }

    if (type === 'completion') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }

    if (type === 'sales') {
      return <ShoppingBag className="h-4 w-4 text-blue-500" />;
    }

    return <Bell className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="hidden h-screen w-64 shrink-0 border-r border-slate-900 bg-slate-950 lg:block">
        <Sidebar />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed bottom-0 left-0 top-0 z-40 w-64 shadow-2xl">
            <Sidebar />
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 transition-all hover:text-slate-200 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950/70 px-4 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 items-center space-x-4">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 transition-all hover:text-slate-200 active:scale-95 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 sm:text-sm">
              {getPageTitle(location.pathname)}
            </h1>
          </div>

          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                aria-label="Open notifications"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg border text-slate-400 transition-all hover:bg-slate-900/40 hover:text-slate-200 active:scale-90 ${
                  notificationsOpen
                    ? 'border-slate-700 bg-slate-900 text-slate-200'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white ring-2 ring-slate-950">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl md:w-96">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Notifications
                    </h3>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 space-y-2.5 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs font-medium text-slate-500">
                        No active system alerts.
                      </p>
                    ) : (
                      notifications.map((notification, index) => (
                        <button
                          type="button"
                          key={notification?.id ?? `notification-${index}`}
                          onClick={() => {
                            if (!notification?.read && notification?.id) {
                              markAsRead(notification.id);
                            }
                          }}
                          className={`flex w-full items-start space-x-3 rounded-lg p-2.5 text-left transition-all ${
                            notification?.read
                              ? 'bg-transparent opacity-60'
                              : 'border border-slate-800/50 bg-slate-950/40 hover:bg-slate-950/70'
                          }`}
                        >
                          <div className="mt-0.5">
                            {renderNotificationIcon(notification?.type)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="truncate text-xs font-semibold text-slate-200">
                                {notification?.title || 'Notification'}
                              </p>
                              <span className="shrink-0 text-[9px] font-medium text-slate-500">
                                {notification?.time || ''}
                              </span>
                            </div>

                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                              {notification?.message || 'No message provided.'}
                            </p>
                          </div>

                          {!notification?.read && (
                            <Circle className="mt-1.5 h-2 w-2 shrink-0 fill-blue-500 text-blue-500" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                aria-label="Open user menu"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                className={`flex items-center space-x-2.5 rounded-lg border px-3 py-1.5 transition-all hover:bg-slate-900/40 active:scale-95 ${
                  userMenuOpen
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300">
                  {userInitial}
                </div>

                <span className="hidden max-w-[120px] truncate text-xs font-medium text-slate-300 sm:block">
                  {displayShortName}
                </span>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-56 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 shadow-2xl backdrop-blur-xl">
                  <div className="border-b border-slate-800 px-2.5 pb-2.5 pt-1.5 text-left">
                    <p className="truncate text-xs font-bold text-white">{displayName}</p>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                      {normalizedUser?.email || 'No email available'}
                    </p>
                    <span className="mt-2 inline-block rounded bg-blue-900/30 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-blue-400">
                      {normalizedUser?.role || 'No role'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    <button
                      type="button"
                      className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-400 transition-all hover:bg-slate-950/40 hover:text-slate-200"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-400 transition-all hover:bg-red-950/20 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-950 px-6 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;