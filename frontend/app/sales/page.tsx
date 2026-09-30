'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { Sale, Product, Customer } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export default function SalesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // New Sale Modal & Cart
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Item selector state in modal
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [cartError, setCartError] = useState<string | null>(null);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // View Sale Details Modal
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = search ? `/sales?search=${encodeURIComponent(search)}` : '/sales';
      const [salesRes, prodsRes, custsRes] = await Promise.all([
        apiRequest<Sale[]>(url),
        apiRequest<Product[]>('/products'),
        apiRequest<Customer[]>('/customers'),
      ]);

      setSales(salesRes);
      setProducts(prodsRes);
      setCustomers(custsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data');
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
      loadData();
    }
  }, [user, authLoading, search]);

  const handleOpenNewSale = () => {
    setSelectedCustomerId('');
    setPaymentMethod('Cash');
    setCart([]);
    setSelectedProductId(products.length > 0 ? products[0].id.toString() : '');
    setItemQuantity(1);
    setCartError(null);
    setSaleSuccessMessage(null);
    setIsNewSaleOpen(true);
  };

  const handleAddToCart = () => {
    setCartError(null);
    if (!selectedProductId) {
      setCartError('Please choose a product to add.');
      return;
    }

    const prod = products.find((p) => p.id === parseInt(selectedProductId));
    if (!prod) {
      setCartError('Product not found.');
      return;
    }

    if (itemQuantity <= 0) {
      setCartError('Quantity must be greater than 0.');
      return;
    }

    // Check existing quantity in cart
    const existingIndex = cart.findIndex((item) => item.product.id === prod.id);
    const existingQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const totalQtyNeeded = existingQty + itemQuantity;

    if (totalQtyNeeded > prod.stock_quantity) {
      setCartError(
        `Insufficient stock for '${prod.name}'. Only ${prod.stock_quantity} available (you already have ${existingQty} in cart).`
      );
      return;
    }

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity = totalQtyNeeded;
      updated[existingIndex].subtotal = round(totalQtyNeeded * prod.price);
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product: prod,
          quantity: itemQuantity,
          subtotal: round(itemQuantity * prod.price),
        },
      ]);
    }

    // Reset selector
    setItemQuantity(1);
  };

  const handleRemoveFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const calculateGrandTotal = () => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  };

  const round = (num: number) => Math.round(num * 100) / 100;

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setCartError('Please add at least one item to the sale.');
      return;
    }

    setSubmittingSale(true);
    setCartError(null);
    try {
      const payload = {
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        notes: `POS Transaction • ${paymentMethod}`,
      };

      const result = await apiRequest<Sale>('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSaleSuccessMessage(`Sale recorded successfully! Total: ${result.total_amount.toLocaleString()} ETB`);
      setTimeout(() => {
        setIsNewSaleOpen(false);
        loadData();
      }, 1200);
    } catch (err: any) {
      setCartError(err.message || 'Transaction could not be completed.');
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title="Sales & Point of Sale" 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sales Records & POS
              </h2>
              <p className="text-sm text-slate-500">
                Execute transactions with real-time stock deduction in Ethiopian Birr (ETB)
              </p>
            </div>

            <button
              onClick={handleOpenNewSale}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Sale (POS)
            </button>
          </div>

          {/* Search bar */}
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sales by customer name or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Sales Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No sales recorded</h4>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Click 'New Sale' above to record a retail transaction.
                </p>
                <button
                  onClick={handleOpenNewSale}
                  className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> New Sale
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Total (ETB)</th>
                      <th className="px-6 py-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.map((s) => {
                      const totalQty = s.items.reduce((acc, item) => acc + item.quantity, 0);
                      const d = new Date(s.created_at);
                      const formattedDate = isNaN(d.getTime())
                        ? s.created_at
                        : d.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                            #{s.id.toString().padStart(5, '0')}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {s.customer_name || 'Walk-in Customer'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-xs">
                            <span className="font-semibold text-slate-800">{totalQty} items</span>
                            <span className="text-slate-400 block truncate max-w-[200px]">
                              {s.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {s.payment_method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {formattedDate}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-base">
                            {s.total_amount.toLocaleString()} ETB
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setViewingSale(s)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                              title="View receipt"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Sale Modal (Point of Sale) */}
      <Modal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        title="Point of Sale — Record New Transaction"
        maxWidth="xl"
      >
        {saleSuccessMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900">{saleSuccessMessage}</h4>
            <p className="text-xs text-slate-500">Stock decremented and revenue ledger updated.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {cartError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{cartError}</span>
              </div>
            )}

            {/* Customer & Payment Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Walk-in Customer (General)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Cash">Cash (ETB)</option>
                  <option value="Telebirr">Telebirr</option>
                  <option value="CBE Birr">CBE Birr</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Add Item to Cart Section */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Add Items to Cart
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Select Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} — {p.price} ETB {p.stock_quantity <= 0 ? '(OUT OF STOCK)' : `(${p.stock_quantity} in stock)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-center font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full rounded-xl bg-slate-900 py-2 text-sm font-bold text-white hover:bg-slate-800 transition"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Items Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Cart is empty. Select products above to build transaction.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{item.product.name}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600">{item.product.price.toFixed(2)} ETB</td>
                        <td className="p-3 text-right font-bold text-slate-900">{item.subtotal.toFixed(2)} ETB</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Total Banner */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">Grand Total</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {calculateGrandTotal().toLocaleString()} ETB
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Payment: {paymentMethod}</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {cart.reduce((a, b) => a + b.quantity, 0)} items in transaction
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewSaleOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={submittingSale || cart.length === 0}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition disabled:opacity-50"
              >
                {submittingSale ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Recording Sale...
                  </span>
                ) : (
                  `Confirm & Complete Sale (${calculateGrandTotal().toLocaleString()} ETB)`
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Sale Details Modal (Receipt) */}
      <Modal
        isOpen={!!viewingSale}
        onClose={() => setViewingSale(null)}
        title="Transaction Receipt"
        maxWidth="md"
      >
        {viewingSale && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Receipt #{viewingSale.id.toString().padStart(5, '0')}</span>
                <span>{new Date(viewingSale.created_at).toLocaleString()}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {viewingSale.customer_name}
              </h4>
              <p className="text-xs text-emerald-600 font-semibold">
                Payment: {viewingSale.payment_method}
              </p>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {viewingSale.items.map((item) => (
                <div key={item.id} className="py-2 flex justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{item.product_name}</p>
                    <p className="text-slate-400">{item.quantity} × {item.unit_price} ETB</p>
                  </div>
                  <div className="font-bold text-slate-900 text-right">
                    {item.subtotal.toFixed(2)} ETB
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Total Amount:</span>
              <span className="text-xl font-black text-emerald-600">
                {viewingSale.total_amount.toLocaleString()} ETB
              </span>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setViewingSale(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
