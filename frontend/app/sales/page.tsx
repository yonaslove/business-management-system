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
import { useLanguage } from '@/lib/language';
import { apiRequest } from '@/lib/api';
import { Sale, Product, Customer } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export default function SalesPage() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
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
    if (user?.role === 'delivery') {
      router.push('/delivery');
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
      setCartError(language === 'am' ? 'እባክዎ የሚጨመር ምርት ይምረጡ' : 'Please choose a product to add.');
      return;
    }

    const prod = products.find((p) => p.id === parseInt(selectedProductId));
    if (!prod) {
      setCartError(language === 'am' ? 'ምርቱ አልተገኘም' : 'Product not found.');
      return;
    }

    if (prod.is_verified === false) {
      setCartError(language === 'am' ? `'${prod.name}' መሸጥ አይቻልም። የአስተዳዳሪ ማረጋገጫ በመጠባበቅ ላይ ነው።` : `Cannot sell '${prod.name}'. This product is pending administrator verification.`);
      return;
    }

    if (prod.stock_quantity <= 0) {
      setCartError(language === 'am' ? `'${prod.name}' በክምችት ላይ አልቋል (0 stock)።` : `Cannot sell '${prod.name}'. Product is EMPTY (0 stock available).`);
      return;
    }

    if (itemQuantity <= 0) {
      setCartError(language === 'am' ? 'የብዛት መጠን ከ 0 በላይ መሆን አለበት' : 'Quantity must be greater than 0.');
      return;
    }

    // Check existing quantity in cart
    const existingIndex = cart.findIndex((item) => item.product.id === prod.id);
    const existingQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const totalQtyNeeded = existingQty + itemQuantity;

    if (totalQtyNeeded > prod.stock_quantity) {
      setCartError(
        language === 'am'
          ? `ለ '${prod.name}' በቂ ክምችት የለም። ያለ ክምችት: ${prod.stock_quantity}, የተጠየቀው: ${totalQtyNeeded}።`
          : `Insufficient stock for '${prod.name}'. Available: ${prod.stock_quantity}, requested: ${totalQtyNeeded}.`
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
      setCartError(language === 'am' ? 'እባክዎ ቢያንስ አንድ እቃ ወደ ጋሪው ይጨምሩ' : 'Please add at least one item to the sale.');
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

      setSaleSuccessMessage(
        language === 'am' 
          ? `ሽያጩ በተሳካ ሁኔታ ተመዝግቧል! ድምር: ${result.total_amount.toLocaleString()} ${user?.currency_symbol || 'Br'}`
          : `Sale recorded successfully! Total: ${result.total_amount.toLocaleString()} ${user?.currency_symbol || 'Br'}`
      );
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={t('nav_sales', 'Sales & Point of Sale')} 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'የሽያጭ መዝገብና ፖስ (POS)' : 'Sales Records & POS'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'am' 
                  ? 'ፈጣን የችርቻሮ ሽያጭ መመዝገቢያና የክምችት ቅነሳ' 
                  : `Execute transactions with real-time stock deduction in ${user?.currency || 'ETB'}`}
              </p>
            </div>

            <button
              onClick={handleOpenNewSale}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('btn_new_sale', 'New Sale (POS)')}
            </button>
          </div>

          {/* Search bar */}
          <div className="mb-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'am' ? 'ሽያጮችን በደንበኛ ስም ወይም ማስታወሻ ፈልግ...' : 'Search sales by customer name or notes...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Sales Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShoppingCart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  {language === 'am' ? 'ምንም የተመዘገበ ሽያጭ የለም' : 'No sales recorded'}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {language === 'am' ? 'አዲስ የችርቻሮ ሽያጭ ለመመዝገብ ከላይ ያለውን "አዲስ ሽያጭ" ይጫኑ' : "Click 'New Sale' above to record a retail transaction."}
                </p>
                <button
                  onClick={handleOpenNewSale}
                  className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> {t('btn_new_sale', 'New Sale')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">{language === 'am' ? 'የትራንዛክሽን ቁጥር' : 'Transaction ID'}</th>
                      <th className="px-6 py-4">{t('label_customer', 'Customer')}</th>
                      <th className="px-6 py-4">{t('label_items', 'Items')}</th>
                      <th className="px-6 py-4">{t('payment_method', 'Payment')}</th>
                      <th className="px-6 py-4">{t('label_date', 'Date')}</th>
                      <th className="px-6 py-4 text-right">{t('label_total', 'Total')} ({user?.currency_symbol || 'Br'})</th>
                      <th className="px-6 py-4 text-right">{language === 'am' ? 'ደረሰኝ' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sales.map((s) => {
                      const totalQty = s.items.reduce((acc, item) => acc + item.quantity, 0);
                      const d = new Date(s.created_at);
                      const formattedDate = isNaN(d.getTime())
                        ? s.created_at
                        : d.toLocaleString(language === 'am' ? 'am-ET' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            #{s.id.toString().padStart(5, '0')}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {s.customer_name || (language === 'am' ? 'መደበኛ ደንበኛ' : 'Walk-in Customer')}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {totalQty} {language === 'am' ? 'ዕቃዎች' : 'items'}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 block truncate max-w-[200px]">
                              {s.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {s.payment_method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {formattedDate}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-900 dark:text-white text-base">
                            {s.total_amount.toLocaleString()} {user?.currency_symbol || 'Br'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setViewingSale(s)}
                              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition cursor-pointer"
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
        title={language === 'am' ? 'የሽያጭ መመዝገቢያ (POS) — አዲስ ሽያጭ' : 'Point of Sale — Record New Transaction'}
        maxWidth="xl"
      >
        {saleSuccessMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{saleSuccessMessage}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'am' ? 'ክምችት ተቀንሷል፤ የገቢ መዝገብ ተሻሽሏል' : 'Stock decremented and revenue ledger updated.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {cartError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/60 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{cartError}</span>
              </div>
            )}

            {/* Customer & Payment Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  {t('label_customer', 'Customer')}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">{language === 'am' ? 'መደበኛ ደንበኛ (Walk-in)' : 'Walk-in Customer (General)'}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.is_verified === false}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {c.is_verified === false ? (language === 'am' ? '(ማረጋገጫ በመጠባበቅ ላይ)' : '(Pending Verification)') : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  {t('payment_method', 'Payment Method')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Cash">{t('payment_cash', 'Cash')} ({user?.currency_symbol || 'Br'})</option>
                  <option value="Telebirr">{t('payment_telebirr', 'Telebirr')}</option>
                  <option value="CBE Birr">{t('payment_cbe_birr', 'CBE Birr')}</option>
                  <option value="Bank Transfer">{t('payment_bank_transfer', 'Bank Transfer')}</option>
                </select>
              </div>
            </div>

            {/* Add Item to Cart Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {language === 'am' ? 'ምርቶችን ወደ ጋሪ ጨምር' : 'Add Items to Cart'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">
                    {language === 'am' ? 'ምርት ይምረጡ' : 'Select Product'}
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {products.map((p) => {
                      const isEmpty = p.stock_quantity <= 0;
                      const isUnverified = p.is_verified === false;
                      const label = isEmpty 
                        ? (language === 'am' ? '(አልቋል)' : '(EMPTY)') 
                        : isUnverified 
                        ? (language === 'am' ? '(ማረጋገጫ በመጠባበቅ ላይ)' : '(Pending Verification)') 
                        : `(${p.stock_quantity} ${language === 'am' ? 'በክምችት አለ' : 'in stock'})`;

                      return (
                        <option key={p.id} value={p.id} disabled={isEmpty || isUnverified}>
                          {p.name} — {p.price.toFixed(2)} {user?.currency_symbol || 'Br'} {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">
                    {t('label_quantity', 'Quantity')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm text-center font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full rounded-xl bg-slate-900 dark:bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:hover:bg-emerald-500 transition cursor-pointer"
                  >
                    + {t('btn_add_to_cart', 'Add Item')}
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Items Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                  <tr>
                    <th className="p-3">{language === 'am' ? 'ምርት' : 'Product'}</th>
                    <th className="p-3 text-center">{language === 'am' ? 'ብዛት' : 'Qty'}</th>
                    <th className="p-3 text-right">{t('label_price', 'Unit Price')}</th>
                    <th className="p-3 text-right">{t('label_subtotal', 'Subtotal')}</th>
                    <th className="p-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500">
                        {language === 'am' ? 'ጋሪው ባዶ ነው። ከላይ ያሉትን ምርቶች ይምረጡ።' : 'Cart is empty. Select products above to build transaction.'}
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.product.name}</td>
                        <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600 dark:text-slate-400">{item.product.price.toFixed(2)} {user?.currency_symbol || 'Br'}</td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{item.subtotal.toFixed(2)} {user?.currency_symbol || 'Br'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
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
              <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between border-t border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">{t('label_total', 'Grand Total')}</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {calculateGrandTotal().toLocaleString()} {user?.currency_symbol || 'Br'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{t('payment_method', 'Payment')}: {paymentMethod}</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {cart.reduce((a, b) => a + b.quantity, 0)} {language === 'am' ? 'ዕቃዎች በሽያጭ ውስጥ' : 'items in transaction'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewSaleOpen(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t('btn_cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={submittingSale || cart.length === 0}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
              >
                {submittingSale ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    {t('btn_saving', 'Recording Sale...')}
                  </span>
                ) : (
                  `${t('btn_place_order', 'Confirm & Complete Sale')} (${calculateGrandTotal().toLocaleString()} ${user?.currency_symbol || 'Br'})`
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
        title={t('btn_view_receipt', 'Transaction Receipt')}
        maxWidth="md"
      >
        {viewingSale && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>{language === 'am' ? 'ደረሰኝ' : 'Receipt'} #{viewingSale.id.toString().padStart(5, '0')}</span>
                <span>{new Date(viewingSale.created_at).toLocaleString()}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {viewingSale.customer_name || (language === 'am' ? 'መደበኛ ደንበኛ' : 'Walk-in Customer')}
              </h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {t('payment_method', 'Payment')}: {viewingSale.payment_method}
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {viewingSale.items.map((item) => (
                <div key={item.id} className="py-2 flex justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.product_name}</p>
                    <p className="text-slate-400 dark:text-slate-500">{item.quantity} × {item.unit_price} {user?.currency_symbol || 'Br'}</p>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-right">
                    {item.subtotal.toFixed(2)} {user?.currency_symbol || 'Br'}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('label_total', 'Total Amount')}:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {viewingSale.total_amount.toLocaleString()} {user?.currency_symbol || 'Br'}
              </span>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setViewingSale(null)}
                className="rounded-xl bg-slate-900 dark:bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
              >
                {t('btn_close', 'Close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
