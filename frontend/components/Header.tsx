'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  ShieldCheck, 
  UserCheck, 
  Bell, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  Sparkles, 
  AlertTriangle,
  Settings,
  LogOut,
  ChevronDown,
  CheckCheck,
  X,
  Truck,
  ShoppingBag,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useLanguage } from '@/lib/language';
import { AdminNotificationSummary, ActivityLog } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const isCoAdmin = user?.role === 'co_admin';
  const isDelivery = user?.role === 'delivery';
  const canSeeNotifications = isAdmin || isCoAdmin || isDelivery;

  // Dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Data states
  const [notifData, setNotifData] = useState<AdminNotificationSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'coadmin' | 'pending' | 'ready' | 'proof'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Seen and dismissed tracking
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  // Refs for outside click
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load seen & dismissed IDs from localStorage
  useEffect(() => {
    if (!user?.id) return;
    try {
      const storedSeen = localStorage.getItem(`bms_seen_notif_${user.id}`);
      if (storedSeen) setSeenIds(JSON.parse(storedSeen));

      const storedDismissed = localStorage.getItem(`bms_dismissed_notif_${user.id}`);
      if (storedDismissed) setDismissedIds(JSON.parse(storedDismissed));
    } catch (e) {
      // Ignore storage errors
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!canSeeNotifications) return;
    try {
      const res = await apiRequest<AdminNotificationSummary>('/admin/notifications');
      setNotifData(res);
    } catch (e) {
      // Quiet fail if not authorized
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [canSeeNotifications]);

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        if (notificationsOpen) {
          handleDismissCurrentList();
          setNotificationsOpen(false);
        }
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen, profileMenuOpen, notifData, seenIds, dismissedIds, user?.id]);

  // Gather role-relevant active items for badge counting and tray display
  const getRoleNotificationPool = (): ActivityLog[] => {
    if (!notifData) return [];

    let pool: ActivityLog[] = [];
    if (isDelivery) {
      pool = notifData.delivery_orders || [];
    } else if (isCoAdmin) {
      const map = new Map<number, ActivityLog>();
      (notifData.pending_orders || []).forEach((item) => map.set(item.id, item));
      (notifData.pending_approvals || []).forEach((item) => map.set(item.id, item));
      (notifData.delivery_orders || []).forEach((item) => {
        if (item.action === 'CUSTOMER_DELIVERY_ACKNOWLEDGED') {
          map.set(item.id, item);
        }
      });
      pool = Array.from(map.values());
    } else {
      // Admin
      const map = new Map<number, ActivityLog>();
      (notifData.pending_orders || []).forEach((item) => map.set(item.id, item));
      (notifData.pending_approvals || []).forEach((item) => map.set(item.id, item));
      (notifData.coadmin_activities || []).forEach((item) => map.set(item.id, item));
      (notifData.delivery_orders || []).forEach((item) => {
        if (item.action === 'CUSTOMER_DELIVERY_ACKNOWLEDGED') {
          map.set(item.id, item);
        }
      });
      pool = Array.from(map.values());
    }

    return pool;
  };

  // Dismiss currently visible items so they won't appear next time
  const handleDismissCurrentList = () => {
    if (!notifData || !user?.id) return;
    const currentList = getRawFilteredItems();
    if (currentList.length === 0) return;

    const idsToDismiss = currentList.map((item) => item.id);
    const updated = Array.from(new Set([...dismissedIds, ...idsToDismiss]));
    setDismissedIds(updated);
    try {
      localStorage.setItem(`bms_dismissed_notif_${user.id}`, JSON.stringify(updated));
    } catch (e) {}

    // Notify backend
    apiRequest('/admin/notifications/clear', { method: 'POST' }).catch(() => {});
  };

  // Toggle notification popover & immediately remove badge number from icon
  const handleToggleNotifications = () => {
    if (!notificationsOpen) {
      // Opening the tray: mark all current pool items as seen so badge count resets to 0
      if (notifData && user?.id) {
        const allCurrent = getRoleNotificationPool();
        const newIds = allCurrent.map((i) => i.id);
        const updatedSeen = Array.from(new Set([...seenIds, ...newIds]));
        setSeenIds(updatedSeen);
        try {
          localStorage.setItem(`bms_seen_notif_${user.id}`, JSON.stringify(updatedSeen));
        } catch (e) {}

        // Tell backend to update status to SEEN
        apiRequest('/admin/notifications/mark-seen', { method: 'POST' }).catch(() => {});
      }
      setNotificationsOpen(true);
    } else {
      // Closing the tray: dismiss seen items so list is removed
      handleDismissCurrentList();
      setNotificationsOpen(false);
    }
  };

  // Clear list button inside popover
  const handleClearAllList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDismissCurrentList();
  };

  // Dismiss a single notification item from the list
  const handleDismissSingleItem = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) return;
    const updated = Array.from(new Set([...dismissedIds, id]));
    setDismissedIds(updated);
    try {
      localStorage.setItem(`bms_dismissed_notif_${user.id}`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Permanent deletion of activity report (Admin only)
  const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to permanently delete this activity report?')) return;

    setDeletingId(id);
    try {
      await apiRequest(`/admin/activities/${id}`, { method: 'DELETE' });
      // Remove from dismissed & local state
      handleDismissSingleItem(id, e);
      setNotifData((prev) => {
        if (!prev) return null;
        const newPending = prev.pending_approvals.filter((a) => a.id !== id);
        const newCoadmin = (prev.coadmin_activities || []).filter((a) => a.id !== id);
        const newRecent = prev.recent_activities.filter((a) => a.id !== id);
        const newOrders = (prev.pending_orders || []).filter((a) => a.id !== id);
        const newDelivery = (prev.delivery_orders || []).filter((a) => a.id !== id);
        return {
          ...prev,
          pending_approvals: newPending,
          pending_approvals_count: newPending.length,
          coadmin_activities: newCoadmin,
          coadmin_activities_count: newCoadmin.length,
          pending_orders: newOrders,
          pending_orders_count: newOrders.length,
          delivery_orders: newDelivery,
          delivery_orders_count: newDelivery.length,
          recent_activities: newRecent,
          total_notifications_count: Math.max(0, (prev.total_notifications_count ?? 1) - 1),
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete activity report.');
    } finally {
      setDeletingId(null);
    }
  };

  const roleLabel = isAdmin 
    ? 'Admin Role' 
    : isCoAdmin 
    ? 'Co-Manager' 
    : isDelivery
    ? 'Delivery Courier'
    : 'Staff Role';

  // Compute raw items before dismissal
  const getRawFilteredItems = (): ActivityLog[] => {
    if (!notifData) return [];

    let pool: ActivityLog[] = [];
    if (isDelivery) {
      if (activeTab === 'ready') {
        pool = (notifData.delivery_orders || []).filter(
          (item) => item.action === 'DELIVERY_ORDER_READY' || item.action === 'VERIFY_ONLINE_PAYMENT' || item.details.includes('VERIFIED') || item.details.includes('CONFIRMED')
        );
      } else if (activeTab === 'proof') {
        pool = (notifData.delivery_orders || []).filter(
          (item) => item.action === 'CUSTOMER_DELIVERY_ACKNOWLEDGED'
        );
      } else {
        pool = notifData.delivery_orders || [];
      }
    } else {
      if (activeTab === 'orders') {
        pool = notifData.pending_orders || [];
      } else if (activeTab === 'coadmin') {
        pool = notifData.coadmin_activities || [];
      } else if (activeTab === 'pending') {
        pool = notifData.pending_approvals || [];
      } else {
        // 'all' tab
        const map = new Map<number, ActivityLog>();
        (notifData.pending_orders || []).forEach((item) => map.set(item.id, item));
        (notifData.pending_approvals || []).forEach((item) => map.set(item.id, item));
        if (isAdmin) {
          (notifData.coadmin_activities || []).forEach((item) => map.set(item.id, item));
        }
        (notifData.delivery_orders || []).forEach((item) => {
          if (item.action === 'CUSTOMER_DELIVERY_ACKNOWLEDGED') {
            map.set(item.id, item);
          }
        });
        pool = Array.from(map.values());
      }
    }

    const uniqueMap = new Map<number, ActivityLog>();
    pool.forEach((item) => {
      if (item && item.id) uniqueMap.set(item.id, item);
    });

    return Array.from(uniqueMap.values())
      .filter((item) => !dismissedIds.includes(item.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const displayedItems = getRawFilteredItems();

  // Active unread / unseen badge count
  // An item counts towards the badge ONLY if it is not seen yet AND not dismissed
  const rolePool = getRoleNotificationPool();
  const allActiveItems = rolePool.filter((item) => !dismissedIds.includes(item.id));
  const unseenItems = allActiveItems.filter((item) => !seenIds.includes(item.id));
  const badgeCount = unseenItems.length;


  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{title}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Dynamic Currency badge */}
        <div className="hidden md:flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {t('label_currency', 'Currency')}: {user?.currency || 'ETB'} ({user?.currency_symbol || 'Br'})
        </div>

        {/* Dual Language Switcher (EN / አማ) */}
        <button
          onClick={toggleLanguage}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
          title={language === 'en' ? "Switch to Amharic (ወደ አማርኛ ቀይር)" : "Switch to English"}
        >
          <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}</span>
        </button>

        {/* Theme Switcher (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* ========================================================================= */}
        {/* NOTIFICATIONS BELL: Numbers removed when seen, list removed once seen */}
        {/* ========================================================================= */}
        {canSeeNotifications && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggleNotifications}
              className={`relative p-2.5 rounded-xl transition ${
                notificationsOpen 
                  ? 'bg-slate-100 text-slate-900 ring-2 ring-emerald-500/20' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
              title={
                isDelivery 
                  ? "Delivery Logistics Notifications" 
                  : isCoAdmin 
                  ? "Order Verifications & Approvals" 
                  : "Admin Approvals & Activity Hub"
              }
            >
              <Bell className="h-5 w-5" />
              {/* Badge is completely removed once seen */}
              {badgeCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full text-[10px] font-black text-white shadow-xs animate-pulse bg-red-500 ring-2 ring-white">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div 
                className="absolute right-0 mt-2 w-84 sm:w-[420px] rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-slate-900">Notifications & Activity</span>
                    {badgeCount > 0 ? (
                      <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-bold animate-pulse">
                        {badgeCount} New
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[11px] font-semibold">
                        All Seen
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {displayedItems.length > 0 && (
                      <button
                        onClick={handleClearAllList}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center transition px-2 py-1 rounded-lg hover:bg-slate-100"
                        title="Clear all seen items from this tray"
                      >
                        <CheckCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                        Clear List
                      </button>
                    )}
                    <Link
                      href={isDelivery ? "/delivery" : isCoAdmin ? "/orders" : "/admin"}
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center transition"
                    >
                      {isDelivery ? "Delivery Hub" : isCoAdmin ? "Online Orders" : "Admin Hub"} <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Filter Tabs */}
                {isDelivery ? (
                  <div className="flex items-center space-x-1 mt-2.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition ${
                        activeTab === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All ({displayedItems.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('ready')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 ${
                        activeTab === 'ready'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                      }`}
                    >
                      <Truck className="h-3 w-3" />
                      <span>Ready ({(notifData?.delivery_orders || []).filter(i => !dismissedIds.includes(i.id) && (i.action === 'DELIVERY_ORDER_READY' || i.action === 'VERIFY_ONLINE_PAYMENT' || i.details.includes('VERIFIED') || i.details.includes('CONFIRMED'))).length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('proof')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 ${
                        activeTab === 'proof'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Proofs ({(notifData?.delivery_orders || []).filter(i => !dismissedIds.includes(i.id) && i.action === 'CUSTOMER_DELIVERY_ACKNOWLEDGED').length})</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 mt-2.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition ${
                        activeTab === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All ({displayedItems.length})
                    </button>

                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 ${
                        activeTab === 'orders'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
                      }`}
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>Orders ({(notifData?.pending_orders || []).filter(i => !dismissedIds.includes(i.id)).length})</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setActiveTab('coadmin')}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 ${
                          activeTab === 'coadmin'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Co-Manager ({(notifData?.coadmin_activities || []).filter(i => !dismissedIds.includes(i.id)).length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 ${
                        activeTab === 'pending'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>Pending ({(notifData?.pending_approvals || []).filter(i => !dismissedIds.includes(i.id)).length})</span>
                    </button>
                  </div>
                )}

                {/* Notification Items List */}
                <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-0.5">
                  {displayedItems.length > 0 ? (
                    displayedItems.map((item) => {
                      const isCoadmin = 
                        item.action.startsWith('COADMIN_') || 
                        (item as any).user_role === 'co_admin';
                      const isPending = item.status === 'PENDING_APPROVAL';
                      const isOnlineOrder = item.action === 'ONLINE_ORDER_PLACED';
                      const isDeliveryReady = item.action === 'DELIVERY_ORDER_READY' || item.action === 'VERIFY_ONLINE_PAYMENT' || item.details.includes('VERIFIED') || item.details.includes('CONFIRMED');
                      const isCustomerProof = item.action === 'CUSTOMER_DELIVERY_ACKNOWLEDGED';

                      return (
                        <div
                          key={item.id}
                          className={`group relative p-3 rounded-xl border transition ${
                            isOnlineOrder
                              ? 'bg-blue-50/60 border-blue-200/80 hover:bg-blue-100/60'
                              : isCustomerProof
                              ? 'bg-teal-50/60 border-teal-200/80 hover:bg-teal-100/60'
                              : isDeliveryReady
                              ? 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/60'
                              : isCoadmin
                              ? 'bg-purple-50/60 border-purple-200/80 hover:bg-purple-100/60'
                              : isPending
                              ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/60'
                              : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                {isOnlineOrder && (
                                  <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-blue-300">
                                    <ShoppingBag className="h-2.5 w-2.5 mr-0.5" />
                                    Online Order
                                  </span>
                                )}
                                {isDeliveryReady && !isOnlineOrder && (
                                  <span className="inline-flex items-center rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-emerald-300">
                                    <Truck className="h-2.5 w-2.5 mr-0.5" />
                                    Ready to Deliver
                                  </span>
                                )}
                                {isCustomerProof && (
                                  <span className="inline-flex items-center rounded-md bg-teal-100 text-teal-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-teal-300">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                    Customer Proof
                                  </span>
                                )}
                                {isCoadmin && !isOnlineOrder && !isCustomerProof && (
                                  <span className="inline-flex items-center rounded-md bg-purple-100 text-purple-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-purple-300">
                                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                    Co-Manager Action
                                  </span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-amber-300">
                                    Pending Approval
                                  </span>
                                )}
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {item.action.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 mt-1 line-clamp-2 leading-relaxed">
                                {item.details}
                              </p>

                              <div className="mt-1.5 flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                                  <span>By: <strong className="text-slate-700 font-semibold">{item.user_name}</strong></span>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Clock className="mr-1 h-2.5 w-2.5" />
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                {isOnlineOrder ? (
                                  <Link
                                    href="/orders"
                                    onClick={() => setNotificationsOpen(false)}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center"
                                  >
                                    Verify Receipt <ArrowRight className="ml-0.5 h-2.5 w-2.5" />
                                  </Link>
                                ) : isDeliveryReady ? (
                                  <Link
                                    href="/delivery"
                                    onClick={() => setNotificationsOpen(false)}
                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center"
                                  >
                                    Deliver <ArrowRight className="ml-0.5 h-2.5 w-2.5" />
                                  </Link>
                                ) : isCustomerProof ? (
                                  <Link
                                    href={isDelivery ? "/delivery" : "/orders"}
                                    onClick={() => setNotificationsOpen(false)}
                                    className="text-[10px] font-bold text-teal-600 hover:text-teal-800 flex items-center"
                                  >
                                    View Proof <ArrowRight className="ml-0.5 h-2.5 w-2.5" />
                                  </Link>
                                ) : isPending ? (
                                  <Link
                                    href="/admin"
                                    onClick={() => setNotificationsOpen(false)}
                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-800 flex items-center"
                                  >
                                    Review <ArrowRight className="ml-0.5 h-2.5 w-2.5" />
                                  </Link>
                                ) : null}
                              </div>
                            </div>

                            {/* Actions: Dismiss or Delete */}
                            <div className="flex items-center space-x-1">
                              {/* Dismiss from active list */}
                              <button
                                onClick={(e) => handleDismissSingleItem(item.id, e)}
                                title="Dismiss notification"
                                className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>

                              {/* Deletion Icon for Admin (Permanent DB Delete) */}
                              {isAdmin && (
                                <button
                                  onClick={(e) => handleDeleteNotification(item.id, e)}
                                  disabled={deletingId === item.id}
                                  title="Delete this report permanently from database"
                                  className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                                >
                                  {deletingId === item.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-70" />
                      <span className="font-bold text-slate-700">All caught up!</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        No new notifications. All previous activities have been reviewed.
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                  <Link
                    href={isDelivery ? "/delivery" : isCoAdmin ? "/orders" : "/admin"}
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
                  >
                    {isDelivery
                      ? "Open Delivery Terminal & Courier Queue →"
                      : isCoAdmin
                      ? "View All Online Orders & Receipts in Orders Page →"
                      : "View Full Audit Trails & Reports in Admin Page →"}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PROFILE BUTTON IN TOP RIGHT CORNER: Click opens Settings & Logout menu */}
        {/* ========================================================================= */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={`flex items-center space-x-2.5 p-1 rounded-xl transition cursor-pointer select-none ${
              profileMenuOpen 
                ? 'bg-slate-100 ring-2 ring-emerald-500/20' 
                : 'hover:bg-slate-100'
            }`}
            title="User Profile & Settings"
          >
            {/* Business and Role status */}
            <div className="flex items-center space-x-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
              {isAdmin ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              ) : isDelivery ? (
                <Truck className="h-4 w-4 text-amber-600" />
              ) : isCoAdmin ? (
                <Sparkles className="h-4 w-4 text-purple-600" />
              ) : (
                <UserCheck className="h-4 w-4 text-blue-600" />
              )}
              <span className="font-semibold text-slate-900 hidden sm:inline">{user?.business_name || 'My Store'}</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className={`font-bold ${
                isAdmin ? 'text-emerald-700' : isCoAdmin ? 'text-purple-700' : isDelivery ? 'text-amber-700' : 'text-blue-700'
              }`}>
                {roleLabel}
              </span>
            </div>

            {/* Avatar */}
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-xs ${
              isAdmin ? 'bg-emerald-700' : isCoAdmin ? 'bg-purple-700' : isDelivery ? 'bg-amber-600' : 'bg-blue-700'
            }`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* Chevron Icon */}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-150 ${profileMenuOpen ? 'rotate-180 text-slate-600' : ''}`} />
          </button>

          {/* Profile Dropdown Menu with Settings & Logout */}
          {profileMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Details Header */}
              <div className="p-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-xs ${
                    isAdmin ? 'bg-emerald-700' : isCoAdmin ? 'bg-purple-700' : isDelivery ? 'bg-amber-600' : 'bg-blue-700'
                  }`}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Staff User'}</h4>
                    <p className="text-xs text-slate-500 truncate">@{user?.username || 'user'}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                    isAdmin 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : isCoAdmin 
                      ? 'bg-purple-50 text-purple-800 border-purple-200' 
                      : isDelivery
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {roleLabel}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[120px]">
                    {user?.business_name}
                  </span>
                </div>
              </div>

              {/* Menu Links: Settings */}
              <div className="py-1.5 space-y-0.5">
                <Link
                  href="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Settings & Profile</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-800 font-semibold text-xs transition"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                {isDelivery && (
                  <Link
                    href="/delivery"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-amber-50 text-amber-800 font-semibold text-xs transition"
                  >
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span>Delivery Courier Hub</span>
                  </Link>
                )}

                {isCoAdmin && (
                  <Link
                    href="/orders"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-purple-50 text-purple-800 font-semibold text-xs transition"
                  >
                    <ShoppingBag className="h-4 w-4 text-purple-600" />
                    <span>Online Orders</span>
                  </Link>
                )}
              </div>

              {/* Sign Out / Logout */}
              <div className="pt-1.5 border-t border-slate-100">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 font-semibold text-xs transition text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
