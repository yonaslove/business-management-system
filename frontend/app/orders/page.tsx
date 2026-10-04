'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Loader2, 
  Printer, 
  XCircle, 
  Check, 
  Coins, 
  ArrowRight,
  RefreshCw,
  Eye,
  FileText,
  ExternalLink,
  ShieldCheck,
  X,
  Copy,
  CheckCheck,
  Camera
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { apiRequest } from '@/lib/api';
import { Sale } from '@/types';

export default function OrdersPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isAdminOrCoAdmin = user?.role === 'admin' || user?.role === 'co_admin';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED'>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Receipt viewing modal
  const [receiptModalOrder, setReceiptModalOrder] = useState<Sale | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Rejection modal
  const [rejectingOrder, setRejectingOrder] = useState<Sale | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Customer Delivery Proof Photo modal
  const [customerProofModalOrder, setCustomerProofModalOrder] = useState<Sale | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Sale[]>('/sales?online_only=true');
      setOrders(data);
    } catch (err) {
      console.error('Failed to load online orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Poll every 15s for new orders
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string, notes?: string) => {
    setUpdatingId(orderId);
    try {
      const updated = await apiRequest<Sale>(`/sales/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, notes }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (receiptModalOrder?.id === orderId) {
        setReceiptModalOrder(updated);
      }
      if (rejectingOrder?.id === orderId) {
        setRejectingOrder(null);
        setRejectionReason('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const currencySymbol = user?.currency_symbol || 'Br';

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const statusMatch = statusFilter === 'ALL' || o.order_status === statusFilter;
    const sTerm = search.toLowerCase().trim();
    const searchMatch =
      !sTerm ||
      (o.customer_name && o.customer_name.toLowerCase().includes(sTerm)) ||
      (o.customer_phone && o.customer_phone.includes(sTerm)) ||
      (o.notes && o.notes.toLowerCase().includes(sTerm)) ||
      (o.payment_ref && o.payment_ref.toLowerCase().includes(sTerm)) ||
      o.id.toString() === sTerm;

    return statusMatch && searchMatch;
  });

  // Calculate stats
  const totalCount = orders.length;
  const pendingVerificationCount = orders.filter((o) => o.order_status === 'PENDING_VERIFICATION' || o.order_status === 'PENDING').length;
  const readyForDeliveryCount = orders.filter((o) => o.order_status === 'VERIFIED' || o.order_status === 'CONFIRMED').length;
  const dispatchedCount = orders.filter((o) => o.order_status === 'DISPATCHED').length;
  const deliveredCount = orders.filter((o) => o.order_status === 'DELIVERED').length;
  const totalOnlineRevenue = orders
    .filter((o) => o.order_status !== 'CANCELLED' && o.order_status !== 'REJECTED')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-lg bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-xs font-black uppercase text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
            {t('status_pending_verification', 'Pending Verification')}
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {language === 'am' ? 'የተረጋገጠ • ለማድረስ ዝግጁ' : 'Verified • Ready for Delivery'}
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-black uppercase text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {language === 'am' ? 'የተረጋገጠ' : 'Confirmed'}
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center rounded-lg bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 text-xs font-black uppercase text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Truck className="mr-1.5 h-3.5 w-3.5" />
            {t('status_dispatched', 'Out for Delivery')}
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {t('status_delivered', 'Delivered')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center rounded-lg bg-red-50 dark:bg-red-950/60 px-2.5 py-1 text-xs font-black uppercase text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            {t('status_rejected', 'Payment Rejected')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-black uppercase text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            {t('status_cancelled', 'Cancelled')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-lg bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-black uppercase text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            {status || 'Completed'}
          </span>
        );
    }
  };

  const handlePrintSlip = (order: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Delivery Slip - Order #${order.id}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 450px; margin: auto; }
            h2 { margin: 0 0 4px; text-align: center; }
            .sub { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 16px; }
            .box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th, td { text-align: left; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
            th { color: #64748b; }
            .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 12px; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
          </style>
        </head>
        <body>
          <h2>${user?.business_name || 'Retail Store'}</h2>
          <div class="sub">CUSTOMER DELIVERY SLIP • ORDER #${order.id}</div>
          
          <div class="box">
            <div><strong>Customer:</strong> ${order.customer_name || 'Walk-in'}</div>
            <div><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</div>
            <div><strong>Destination:</strong> ${order.customer_address || 'Delivery Address'}</div>
            <div><strong>Payment Method:</strong> ${order.payment_method}</div>
            ${order.payment_ref ? `<div><strong>Bank Reference:</strong> ${order.payment_ref}</div>` : ''}
            <div><strong>Status:</strong> ${order.order_status}</div>
            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</div>
          </div>

          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th style="text-align:right">Subtotal</th></tr>
            </thead>
            <tbody>
              ${order.items.map(i => `
                <tr>
                  <td>${i.product_name}</td>
                  <td>${i.quantity}</td>
                  <td style="text-align:right">${currencySymbol} ${i.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">Total Due: ${currencySymbol} ${order.total_amount.toFixed(2)}</div>
          <div class="footer">Thank you for ordering with us! Please inspect items on delivery.</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (user?.role === 'employee') {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} title={t('nav_orders', 'Customer Online Orders')} />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <ShieldCheck className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'am' ? 'መዳረሻ ተከልክሏል' : 'Access Restricted'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {language === 'am'
                  ? 'የኦንላይን ትዕዛዝ ማረጋገጫና አመራር የተፈቀደው ለአስተዳዳሪዎችና ለረዳት ስራ አስኪያጆች ብቻ ነው።'
                  : 'Online order verification and management is restricted to Store Administrators and Co-Admins.'}
              </p>
              <Link
                href="/employee"
                className="mt-6 inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                {language === 'am' ? 'ወደ ሰራተኛ የስራ ገጽ ሂድ' : 'Go to Staff Workspace'}
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={t('nav_orders', 'Customer Online Orders')} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'am' ? 'የኦንላይን ትዕዛዞችና ክፍያ ማረጋገጫ ማዕከል' : 'Online Dispatch & Verification Hub'}
                </h2>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                  {language === 'am' ? 'የአስተዳዳሪ መቆጣጠሪያ' : 'Admin & Co-Admin Gate'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'am'
                  ? 'የባንክና ቴሌብር ደረሰኞችን ይፈትሹ፣ ክፍያ ያረጋግጡ፣ እና የተፈቀዱ ትዕዛዞችን ለአድራሽ ሹፌር ይላኩ።'
                  : 'Review bank payment receipts, verify transfers, and release approved online orders to the delivery queue.'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="/shop"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
              >
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {t('nav_storefront', 'Open Storefront')}
              </a>

              <a
                href="/delivery"
                className="inline-flex items-center rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs cursor-pointer"
              >
                <Truck className="mr-1.5 h-3.5 w-3.5" />
                {t('nav_delivery', 'Delivery Terminal')}
              </a>

              <button
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
                title="Refresh orders"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
            <div className="rounded-2xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/30 p-4 shadow-xs">
              <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase block">
                {t('status_pending_verification', 'Pending Verification')}
              </span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{pendingVerificationCount}</p>
              <p className="text-[11px] text-amber-900/70 dark:text-amber-400/70 mt-0.5">
                {language === 'am' ? 'ደረሰኝ በመጠባበቅ ላይ' : 'Awaiting receipt review'}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/30 p-4 shadow-xs">
              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 uppercase block">
                {language === 'am' ? 'ለማድረስ ዝግጁ' : 'Ready for Delivery'}
              </span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{readyForDeliveryCount}</p>
              <p className="text-[11px] text-emerald-900/70 dark:text-emerald-400/70 mt-0.5">
                {language === 'am' ? 'የተረጋገጡ' : 'Verified & confirmed'}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200/90 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/30 p-4 shadow-xs">
              <span className="text-[11px] font-black text-purple-800 dark:text-purple-300 uppercase block">
                {language === 'am' ? 'በጉዞ ላይ ያለ' : 'In Transit'}
              </span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1">{dispatchedCount}</p>
              <p className="text-[11px] text-purple-900/70 dark:text-purple-400/70 mt-0.5">
                {language === 'am' ? 'ለአድራሽ የተሰጠ' : 'Dispatched to driver'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                {t('status_delivered', 'Delivered')}
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{deliveredCount}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'am' ? 'በተሳካ ሁኔታ ደርሷል' : 'Successfully arrived'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                {language === 'am' ? 'የኦንላይን ሽያጭ ገቢ' : 'Online Revenue'}
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {currencySymbol} {totalOnlineRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'am' ? `ከ ${totalCount} አጠቃላይ ትዕዛዞች` : `From ${totalCount} total orders`}
              </p>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'am' ? 'በደንበኛ ስም፣ ስልክ፣ የትዕዛዝ ቁጥር ወይም ባንክ ፈልግ...' : 'Search by customer name, phone, order ID, bank ref...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {([
                'ALL',
                'PENDING_VERIFICATION',
                'VERIFIED',
                'CONFIRMED',
                'DISPATCHED',
                'DELIVERED',
                'CANCELLED',
                'REJECTED'
              ] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab === 'ALL'
                    ? t('status_all', 'All')
                    : tab === 'PENDING_VERIFICATION'
                    ? t('status_pending_verification', 'Pending')
                    : tab === 'VERIFIED'
                    ? t('status_verified', 'Verified')
                    : tab === 'DISPATCHED'
                    ? t('status_dispatched', 'Dispatched')
                    : tab === 'DELIVERED'
                    ? t('status_delivered', 'Delivered')
                    : tab === 'CANCELLED'
                    ? t('status_cancelled', 'Cancelled')
                    : tab === 'REJECTED'
                    ? t('status_rejected', 'Rejected')
                    : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List / Table */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
              <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 dark:text-white">
                {language === 'am' ? 'ምንም የኦንላይን ትዕዛዝ አልተገኘም' : 'No online orders found'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {orders.length === 0
                  ? (language === 'am' ? 'ደንበኞች የኦንላይን መደብሩን በመጎብኘት ትዕዛዝ ማስገባት ይችላሉ።' : 'Customers can place orders by visiting your public online storefront.')
                  : (language === 'am' ? 'የፍለጋ ቃልዎን ይቀይሩ ወይም ሌላ ታብ ይምረጡ።' : 'Try selecting another status tab or adjusting your search keyword.')}
              </p>
              <div className="mt-4">
                <a
                  href="/shop"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
                >
                  {t('nav_storefront', 'Visit Public Storefront')}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isPendingVerif = order.order_status === 'PENDING_VERIFICATION' || order.order_status === 'PENDING';
                const isVerified = order.order_status === 'VERIFIED';
                const isConfirmed = order.order_status === 'CONFIRMED';
                const isDispatched = order.order_status === 'DISPATCHED';
                const isDelivered = order.order_status === 'DELIVERED';
                const isRejected = order.order_status === 'REJECTED';
                const isCancelled = order.order_status === 'CANCELLED';

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-5 shadow-xs transition hover:shadow-md ${
                      isPendingVerif
                        ? 'border-amber-300/90 dark:border-amber-800/80 bg-amber-50/15 dark:bg-amber-950/20'
                        : isVerified
                        ? 'border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/10 dark:bg-emerald-950/20'
                        : isRejected
                        ? 'border-red-200 dark:border-red-900/60 bg-red-50/15 dark:bg-red-950/20'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center space-x-2.5 mb-1.5 flex-wrap gap-y-1">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {language === 'am' ? 'ትዕዛዝ' : 'Order'} #{order.id}
                          </span>
                          {getStatusBadge(order.order_status)}
                          {order.customer_acknowledged && (
                            <span className="inline-flex items-center rounded-lg bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 text-xs font-black uppercase text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                              {language === 'am' ? 'ደንበኛው ርክክቡን አረጋግጧል' : 'Customer Confirmed Receipt'}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(order.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                          <span className="flex items-center font-bold text-slate-900 dark:text-white">
                            {order.customer_name || 'Customer'}
                          </span>

                          {order.customer_phone && (
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="flex items-center text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                            >
                              <Phone className="mr-1 h-3 w-3" />
                              {order.customer_phone}
                            </a>
                          )}

                          {order.customer_address && (
                            <span className="flex items-center text-slate-500 dark:text-slate-400">
                              <MapPin className="mr-1 h-3 w-3 text-slate-400" />
                              {order.customer_address}
                            </span>
                          )}

                          {order.payment_ref && (
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Ref: {order.payment_ref}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Total & Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                        <div className="text-right mr-3">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('label_total', 'Total Amount')}</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            {currencySymbol} {order.total_amount.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {order.payment_method}
                          </span>
                        </div>

                        {/* View Bank Receipt Modal Trigger */}
                        {order.payment_receipt ? (
                          <button
                            onClick={() => setReceiptModalOrder(order)}
                            className="inline-flex items-center rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-xs cursor-pointer"
                            title="Inspect Bank Payment Receipt"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            {language === 'am' ? 'ደረሰኝ ፈትሽ' : 'Review Receipt'}
                          </button>
                        ) : order.payment_ref ? (
                          <button
                            onClick={() => setReceiptModalOrder(order)}
                            className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                          >
                            <FileText className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                            Ref: {order.payment_ref}
                          </button>
                        ) : null}

                        {/* Customer Delivery Proof Photo Trigger */}
                        {order.delivery_proof_image ? (
                          <button
                            onClick={() => setCustomerProofModalOrder(order)}
                            className="inline-flex items-center rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 px-3 py-2 text-xs font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 transition shadow-xs cursor-pointer"
                            title="Inspect Customer's Received Product Proof Photo"
                          >
                            <Camera className="mr-1.5 h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            {language === 'am' ? 'የደንበኛ ፎቶ' : 'Customer Proof'}
                          </button>
                        ) : order.customer_acknowledged ? (
                          <button
                            onClick={() => setCustomerProofModalOrder(order)}
                            className="inline-flex items-center rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/50 px-3 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition shadow-xs cursor-pointer"
                            title="View Customer Acknowledgment"
                          >
                            <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            {language === 'am' ? 'በደንበኛ የተረጋገጠ' : 'Confirmed by Customer'}
                          </button>
                        ) : null}

                        {/* Print Delivery Slip */}
                        <button
                          onClick={() => handlePrintSlip(order)}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                          title="Print Delivery Slip"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {/* Verification Actions (Admin & Co-Admin) */}
                        {isPendingVerif && isAdminOrCoAdmin && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'VERIFIED')}
                              disabled={updatingId === order.id}
                              className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs cursor-pointer"
                              title="Verify Receipt & Release to Delivery"
                            >
                              {updatingId === order.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              {language === 'am' ? 'ክፍያ አረጋግጥና ለአድራሽ ላክ' : 'Verify & Send to Delivery'}
                            </button>

                            <button
                              onClick={() => setRejectingOrder(order)}
                              disabled={updatingId === order.id}
                              className="inline-flex items-center rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100 transition shadow-xs cursor-pointer"
                              title="Reject invalid payment statement"
                            >
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />
                              {t('btn_reject', 'Reject')}
                            </button>
                          </>
                        )}

                        {/* Dispatch to Driver (Verified/Confirmed orders) */}
                        {(isVerified || isConfirmed) && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'DISPATCHED')}
                            disabled={updatingId === order.id}
                            className="inline-flex items-center rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs cursor-pointer"
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Truck className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {t('btn_dispatch', 'Dispatch Delivery')}
                          </button>
                        )}

                        {/* Mark Delivered */}
                        {isDispatched && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                            disabled={updatingId === order.id}
                            className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs cursor-pointer"
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {t('btn_mark_delivered', 'Mark Delivered')}
                          </button>
                        )}

                        {/* Cancel order if not completed */}
                        {!isDelivered && !isCancelled && !isRejected && (
                          <button
                            onClick={() => {
                              if (confirm(language === 'am' ? `ትዕዛዝ #${order.id} ይሰረዝ? ምርቶች ወደ ክምችት ይመለሳሉ።` : `Are you sure you want to cancel Order #${order.id}? Products will be restored to inventory.`)) {
                                handleUpdateStatus(order.id, 'CANCELLED');
                              }
                            }}
                            disabled={updatingId === order.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition shadow-xs cursor-pointer"
                            title="Cancel Order & Restore Stock"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items Grid & Delivery Notes */}
                    <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Items */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                          {language === 'am' ? 'የታዘዙ ዕቃዎች' : 'Ordered Items'} ({order.items.reduce((s, i) => s + i.quantity, 0)} {language === 'am' ? 'ፍሬዎች' : 'units'}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                            >
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold mr-1.5">{item.quantity}x</span>
                              {item.product_name}
                              <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1.5">
                                ({currencySymbol} {item.unit_price.toFixed(2)})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Notes & Details */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                          {language === 'am' ? 'የማድረሻ መመሪያና ዝርዝር' : 'Delivery Instructions & Metadata'}:
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {order.notes || (language === 'am' ? 'መደበኛ ማድረስ' : 'Standard Delivery')}
                        </p>
                        {order.delivery_user_name && (
                          <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 text-[10px] font-bold mt-1">
                            <Truck className="mr-1 h-3 w-3" />
                            {language === 'am' ? 'ሹፌር፦' : 'Driver:'} {order.delivery_user_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Bank Statement Receipt Inspection Modal */}
      {receiptModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {language === 'am' ? `የባንክ ደረሰኝ ፈትሽ — ትዕዛዝ #${receiptModalOrder.id}` : `Verify Bank Receipt — Order #${receiptModalOrder.id}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'am' ? 'ለአድራሽ ሹፌሩ ለመልቀቅ የክፍያ ስቴትመንቱን ያረጋግጡ' : 'Review customer statement to release order to delivery driver'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReceiptModalOrder(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Customer & Payment Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('label_customer', 'Customer')}</span>
                  <span className="font-bold text-slate-900 dark:text-white block truncate">{receiptModalOrder.customer_name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{receiptModalOrder.customer_phone}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'am' ? 'የሚረጋገጥ መጠን' : 'Amount to Verify'}</span>
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-400 block">
                    {currencySymbol} {receiptModalOrder.total_amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{receiptModalOrder.payment_method}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('payment_ref', 'Transaction Reference ID')}</span>
                  {receiptModalOrder.payment_ref ? (
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-xs">
                        {receiptModalOrder.payment_ref}
                      </span>
                      <button
                        onClick={() => handleCopyRef(receiptModalOrder.payment_ref!)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedRef ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">{language === 'am' ? 'ምንም Ref ID አልገባም' : 'No reference ID provided'}</span>
                  )}
                </div>
              </div>

              {/* Receipt File Display */}
              <div>
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 block mb-2">
                  {language === 'am' ? 'የተያያዘ የክፍያ ስቴትመንት / ፎቶ፦' : 'Attached Payment Statement / Screenshot:'}
                </span>

                {receiptModalOrder.payment_receipt ? (
                  receiptModalOrder.payment_receipt.startsWith('data:image/') ? (
                    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900/5 dark:bg-slate-800 p-2 text-center overflow-hidden">
                      <img
                        src={receiptModalOrder.payment_receipt}
                        alt="Payment Receipt"
                        className="max-h-[50vh] w-auto mx-auto object-contain rounded-xl shadow-xs"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            const w = window.open('');
                            w?.document.write(`<img src="${receiptModalOrder.payment_receipt}" style="max-width:100%"/>`);
                          }}
                          className="inline-flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          {language === 'am' ? 'ሙሉ ፎቶውን በትልቅ እይ' : 'Open High-Resolution Original'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-center">
                      <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">PDF Bank Statement Document</p>
                      <iframe
                        src={receiptModalOrder.payment_receipt}
                        className="w-full h-80 rounded-xl border border-slate-200 dark:border-slate-700 mt-3"
                        title="PDF Receipt"
                      />
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 text-xs">
                    {language === 'am' ? 'ምንም ፎቶ አልተያያዘም። የባንክ ማጣቀሻ ቁጥሩን (Ref ID) ይፈትሹ።' : 'No visual receipt attached. Check Bank Reference code or cash collection upon delivery.'}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <button
                onClick={() => setReceiptModalOrder(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t('btn_close', 'Close')}
              </button>

              {isAdminOrCoAdmin && (receiptModalOrder.order_status === 'PENDING_VERIFICATION' || receiptModalOrder.order_status === 'PENDING') && (
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => {
                      setRejectingOrder(receiptModalOrder);
                      setReceiptModalOrder(null);
                    }}
                    className="inline-flex items-center rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 px-4 py-2.5 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100 transition shadow-xs cursor-pointer"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    {language === 'am' ? 'ደረሰኝ ውድቅ አድርግ' : 'Reject Statement'}
                  </button>

                  <button
                    onClick={() => {
                      handleUpdateStatus(receiptModalOrder.id, 'VERIFIED');
                      setReceiptModalOrder(null);
                    }}
                    disabled={updatingId === receiptModalOrder.id}
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {language === 'am' ? 'ክፍያ አረጋግጥና ለአድራሽ ላክ' : 'Verify Payment & Release to Delivery'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Statement Dialog */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <XCircle className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white text-center">
              {language === 'am' ? `ለትዕዛዝ #${rejectingOrder.id} ክፍያን ውድቅ አድርግ` : `Reject Payment for Order #${rejectingOrder.id}`}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
              {language === 'am' ? 'ለዚህ ትዕዛዝ ተይዞ የነበረው ክምችት በቀጥታ ወደ መደብሩ ይመለሳል።' : 'Stock reserved for this order will be automatically restored to store inventory.'}
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                {language === 'am' ? 'የውድቅ የተደረገበት ምክንያት (አማራጭ)' : 'Reason for Rejection (Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder={language === 'am' ? 'ለምሳሌ፦ የተሳሳተ የማጣቀሻ ቁጥር፣ ክፍያው አልደረሰም...' : 'e.g. Invalid bank reference, transaction not reflected in store account...'}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-xs focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setRejectingOrder(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {t('btn_cancel', 'Back')}
              </button>

              <button
                onClick={() => handleUpdateStatus(rejectingOrder.id, 'REJECTED', rejectionReason)}
                disabled={updatingId === rejectingOrder.id}
                className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition cursor-pointer"
              >
                {updatingId === rejectingOrder.id ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                )}
                {language === 'am' ? 'ውድቅ አድርግና ክምችቱን መልስ' : 'Confirm Rejection & Restore Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Delivery Proof Photo Inspection Modal */}
      {customerProofModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-teal-50/60 dark:bg-teal-950/60">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {language === 'am' ? `የደንበኛ ርክክብ ማረጋገጫ — ትዕዛዝ #${customerProofModalOrder.id}` : `Customer Delivery Proof — Order #${customerProofModalOrder.id}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'am' ? 'በደንበኛው የተጫነ የተረከበበት ፎቶ እና ማረጋገጫ' : 'Customer-uploaded photo of received items & confirmation receipt'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCustomerProofModalOrder(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('label_customer', 'Customer')}</span>
                  <span className="font-bold text-slate-900 dark:text-white block truncate">{customerProofModalOrder.customer_name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{customerProofModalOrder.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'am' ? 'የተረጋገጠበት ቀን' : 'Acknowledgment Date'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {customerProofModalOrder.customer_acknowledged_at
                      ? new Date(customerProofModalOrder.customer_acknowledged_at).toLocaleString()
                      : 'Confirmed'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{t('status_verified', 'Verified Received')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'am' ? 'አድራሽ ሹፌር' : 'Delivery Driver'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {customerProofModalOrder.delivery_user_name || (language === 'am' ? 'የተመደበ ሹፌር' : 'Assigned Driver')}
                  </span>
                  <span className="text-[10px] text-slate-400">#{customerProofModalOrder.id}</span>
                </div>
              </div>

              {customerProofModalOrder.customer_feedback && (
                <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/40 p-3.5 text-xs">
                  <span className="font-black uppercase text-teal-800 dark:text-teal-300 text-[10px] block mb-1">
                    {language === 'am' ? 'የደንበኛ አስተያየት / ማስታወሻ፦' : 'Customer Feedback / Notes:'}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium italic">
                    "{customerProofModalOrder.customer_feedback}"
                  </p>
                </div>
              )}

              <div>
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 block mb-2">
                  {language === 'am' ? 'በደንበኛ የተጫነ የእቃ ርክክብ ፎቶ፦' : 'Customer Uploaded Proof Photo:'}
                </span>
                {customerProofModalOrder.delivery_proof_image ? (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900/5 dark:bg-slate-800 p-2 text-center overflow-hidden">
                    <img
                      src={customerProofModalOrder.delivery_proof_image}
                      alt="Customer Delivery Proof"
                      className="max-h-[50vh] w-auto mx-auto object-contain rounded-xl shadow-xs"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => {
                          const w = window.open('');
                          w?.document.write(`<img src="${customerProofModalOrder.delivery_proof_image}" style="max-width:100%"/>`);
                        }}
                        className="inline-flex items-center text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        {language === 'am' ? 'ሙሉ ፎቶውን በትልቅ እይ' : 'Open High-Resolution Original'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 text-xs">
                    {language === 'am' ? 'ምንም ፎቶ አልተጫነም። ደንበኛው በዲጂታል ቁልፍ ርክክቡን አረጋግጧል።' : 'No photo uploaded. The customer acknowledged receipt via one-click digital confirmation.'}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'am' ? 'በኦዲት መዝገብ ላይ ተቀምጧል' : 'Logged in audit activity logs'}
              </span>
              <button
                onClick={() => setCustomerProofModalOrder(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t('btn_close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
