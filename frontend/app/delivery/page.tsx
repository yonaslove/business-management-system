'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Package, 
  Search, 
  Printer, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Check,
  Navigation,
  DollarSign,
  Camera,
  X
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { Sale } from '@/types';

export default function DeliveryTerminalPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'DISPATCHED' | 'DELIVERED'>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Delivery completion modal
  const [completingOrder, setCompletingOrder] = useState<Sale | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');

  // Proof inspection modal
  const [viewingProof, setViewingProof] = useState<Sale | null>(null);

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Sale[]>('/sales?delivery_only=true');
      setOrders(data);
    } catch (err) {
      console.error('Failed to load delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchDeliveryOrders();
      const interval = setInterval(fetchDeliveryOrders, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [user, authLoading, router]);

  const handleUpdateStatus = async (orderId: number, newStatus: string, notes?: string) => {
    setUpdatingId(orderId);
    try {
      const updated = await apiRequest<Sale>(`/sales/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, delivery_notes: notes }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (completingOrder?.id === orderId) {
        setCompletingOrder(null);
        setDeliveryNote('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const currencySymbol = user?.currency_symbol || 'Br';

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const status = o.order_status;
    let matchesTab = true;
    if (statusFilter === 'VERIFIED') {
      matchesTab = status === 'VERIFIED' || status === 'CONFIRMED';
    } else if (statusFilter === 'DISPATCHED') {
      matchesTab = status === 'DISPATCHED';
    } else if (statusFilter === 'DELIVERED') {
      matchesTab = status === 'DELIVERED';
    }

    const sTerm = search.toLowerCase().trim();
    const matchesSearch =
      !sTerm ||
      (o.customer_name && o.customer_name.toLowerCase().includes(sTerm)) ||
      (o.customer_phone && o.customer_phone.includes(sTerm)) ||
      (o.customer_address && o.customer_address.toLowerCase().includes(sTerm)) ||
      (o.notes && o.notes.toLowerCase().includes(sTerm)) ||
      o.id.toString() === sTerm;

    return matchesTab && matchesSearch;
  });

  // Metrics
  const readyCount = orders.filter((o) => o.order_status === 'VERIFIED' || o.order_status === 'CONFIRMED').length;
  const inTransitCount = orders.filter((o) => o.order_status === 'DISPATCHED').length;
  const completedCount = orders.filter((o) => o.order_status === 'DELIVERED').length;

  const handlePrintSlip = (order: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Delivery Dispatch Note - Order #${order.id}</title>
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
          <div class="sub">DELIVERY DISPATCH MANIFEST • ORDER #${order.id}</div>
          
          <div class="box">
            <div><strong>Recipient:</strong> ${order.customer_name || 'Walk-in'}</div>
            <div><strong>Contact Phone:</strong> ${order.customer_phone || 'N/A'}</div>
            <div><strong>Delivery Address:</strong> ${order.customer_address || 'N/A'}</div>
            <div><strong>Payment Mode:</strong> ${order.payment_method}</div>
            <div><strong>Payment Status:</strong> ${order.payment_receipt ? 'PREPAID & VERIFIED BY ADMIN' : 'Collect On Delivery'}</div>
            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</div>
          </div>

          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th style="text-align:right">Price</th></tr>
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

          <div class="total">Order Total: ${currencySymbol} ${order.total_amount.toFixed(2)}</div>
          <div class="footer">Customer Signature: _______________________</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (user?.role === 'employee') {
    return (
      <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} title="Delivery Driver Terminal" />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-xs">
              <Truck className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
              <p className="text-xs text-slate-500 mt-2">
                The Delivery Driver Terminal is restricted to Delivery Personnel and Store Management.
              </p>
              <Link
                href="/employee"
                className="mt-6 inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                Go to Staff Workspace
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Delivery Driver Terminal" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Delivery Driver Terminal
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live queue of verified online customer orders ready for pickup and dispatch.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/orders"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                All Store Orders
              </Link>

              <button
                onClick={fetchDeliveryOrders}
                disabled={loading}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                title="Refresh delivery queue"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/50 p-4 shadow-xs">
              <span className="text-[11px] font-black text-emerald-800 uppercase block">Ready for Pickup</span>
              <p className="text-3xl font-black text-emerald-700 mt-1">{readyCount}</p>
              <p className="text-xs text-emerald-900/70 mt-0.5">Admin verified • Ready to dispatch</p>
            </div>

            <div className="rounded-2xl border border-purple-300/80 bg-purple-50/50 p-4 shadow-xs">
              <span className="text-[11px] font-black text-purple-800 uppercase block">Out for Delivery</span>
              <p className="text-3xl font-black text-purple-700 mt-1">{inTransitCount}</p>
              <p className="text-xs text-purple-900/70 mt-0.5">Currently on road with driver</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Delivered Today</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{completedCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Successfully handed to customer</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name, phone number, address, or order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-medium focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'VERIFIED', 'DISPATCHED', 'DELIVERED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'ALL'
                    ? 'All Queue'
                    : tab === 'VERIFIED'
                    ? `Ready for Pickup (${readyCount})`
                    : tab === 'DISPATCHED'
                    ? `Out for Delivery (${inTransitCount})`
                    : 'Delivered'}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No delivery orders in this queue</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Orders will appear here as soon as Store Admin or Co-Admin verifies the customer payment receipt.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isReady = order.order_status === 'VERIFIED' || order.order_status === 'CONFIRMED';
                const isDispatched = order.order_status === 'DISPATCHED';
                const isDelivered = order.order_status === 'DELIVERED';
                const isPrepaid = Boolean(order.payment_receipt || (order.payment_method !== 'Cash on Delivery'));

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                      isReady
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : isDispatched
                        ? 'border-purple-300 bg-purple-50/15'
                        : 'border-slate-200/90'
                    }`}
                  >
                    {/* Top Row: Order ID, Status, Amount */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-black text-base text-slate-900">
                            Order #{order.id}
                          </span>

                          {isReady && (
                            <span className="inline-flex items-center rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-black uppercase">
                              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                              Ready for Pickup
                            </span>
                          )}

                          {isDispatched && (
                            <span className="inline-flex items-center rounded-lg bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 text-xs font-black uppercase animate-pulse">
                              <Truck className="mr-1 h-3.5 w-3.5 text-purple-600" />
                              Out for Delivery
                            </span>
                          )}

                          {isDelivered && (
                            <span className="inline-flex items-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-black uppercase">
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Delivered
                            </span>
                          )}

                          {order.customer_acknowledged && (
                            <span className="inline-flex items-center rounded-lg bg-teal-50 text-teal-800 border border-teal-300 px-2.5 py-0.5 text-xs font-black uppercase">
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-teal-600" />
                              Customer Confirmed Receipt
                            </span>
                          )}

                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Payment Verification Status Badge */}
                        <div className="flex items-center space-x-2 text-xs">
                          {isPrepaid ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 border border-emerald-200">
                              <Check className="mr-1 h-3 w-3 text-emerald-600" />
                              Prepaid via {order.payment_method} (Verified)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-amber-50 text-amber-800 font-bold px-2 py-0.5 border border-amber-200">
                              <DollarSign className="mr-1 h-3 w-3 text-amber-600" />
                              Collect Cash on Delivery: {currencySymbol} {order.total_amount.toFixed(2)}
                            </span>
                          )}

                          {order.payment_ref && (
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Ref: {order.payment_ref}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Total & Slip */}
                      <div className="flex items-center space-x-3 self-start sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Order Value</span>
                          <span className="text-xl font-black text-slate-900">
                            {currencySymbol} {order.total_amount.toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => handlePrintSlip(order)}
                          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                          title="Print Delivery Manifest"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Customer Address & Direct Phone Dial */}
                    <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100">
                      <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Delivery Destination:
                        </span>
                        <div className="flex items-start space-x-2 text-slate-900">
                          <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold">{order.customer_address || 'No address provided'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{order.notes || 'No special directions'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Customer Contact:
                          </span>
                          <p className="text-sm font-bold text-slate-900">{order.customer_name}</p>
                        </div>

                        {order.customer_phone && (
                          <div className="mt-2">
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                            >
                              <Phone className="mr-1.5 h-3.5 w-3.5" />
                              Call Customer ({order.customer_phone})
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Items to Deliver & Status Actions */}
                    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Items */}
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Items to Handover ({order.items.reduce((sum, i) => sum + i.quantity, 0)} units):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {order.items.map((i) => (
                            <span
                              key={i.id}
                              className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800"
                            >
                              <span className="text-purple-700 font-bold mr-1">{i.quantity}x</span>
                              {i.product_name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Driver Action Button */}
                      <div>
                        {isReady && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'DISPATCHED')}
                            disabled={updatingId === order.id}
                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-purple-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 transition cursor-pointer"
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Truck className="mr-2 h-4 w-4" />
                            )}
                            Start Delivery / Mark Picked Up
                          </button>
                        )}

                        {isDispatched && (
                          <button
                            onClick={() => setCompletingOrder(order)}
                            disabled={updatingId === order.id}
                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Complete Delivery / Handover
                          </button>
                        )}

                        {isDelivered && (
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" />
                              Delivered
                            </span>

                            {order.delivery_proof_image && (
                              <button
                                onClick={() => setViewingProof(order)}
                                className="inline-flex items-center rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-xs cursor-pointer"
                              >
                                <Camera className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                                Customer Proof
                              </button>
                            )}
                          </div>
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

      {/* Complete Delivery Modal */}
      {completingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900 text-center">
              Confirm Delivery for Order #{completingOrder.id}
            </h3>

            <p className="text-xs text-slate-500 text-center mt-1">
              Confirm that items were safely handed to {completingOrder.customer_name}.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-800">{completingOrder.customer_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Collected:</span>
                <span className="font-bold text-emerald-700">
                  {currencySymbol} {completingOrder.total_amount.toFixed(2)} ({completingOrder.payment_method})
                </span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Delivery Notes / Handover Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Handed to customer at door, payment confirmed"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setCompletingOrder(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => handleUpdateStatus(completingOrder.id, 'DELIVERED', deliveryNote)}
                disabled={updatingId === completingOrder.id}
                className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {updatingId === completingOrder.id ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Delivery Proof Modal */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Customer Delivery Confirmation — Order #{viewingProof.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Received by {viewingProof.customer_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingProof(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {viewingProof.customer_feedback && (
                <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-3.5 text-xs">
                  <span className="font-black uppercase text-teal-800 text-[10px] block mb-1">
                    Customer Remarks:
                  </span>
                  <p className="text-slate-700 font-medium italic">
                    "{viewingProof.customer_feedback}"
                  </p>
                </div>
              )}

              {viewingProof.delivery_proof_image ? (
                <div className="relative rounded-2xl border border-slate-200 bg-slate-900/5 p-2 text-center overflow-hidden">
                  <img
                    src={viewingProof.delivery_proof_image}
                    alt="Customer Delivery Proof"
                    className="max-h-[50vh] w-auto mx-auto object-contain rounded-xl shadow-xs"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        const w = window.open('');
                        w?.document.write(`<img src="${viewingProof.delivery_proof_image}" style="max-width:100%"/>`);
                      }}
                      className="inline-flex items-center text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Open Full Size
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                  Customer confirmed arrival digitally.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-bold flex items-center">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Receipt Verified by Customer
              </span>
              <button
                onClick={() => setViewingProof(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
