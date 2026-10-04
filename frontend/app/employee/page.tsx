'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Coins, 
  DollarSign, 
  User, 
  AlertCircle,
  Tag,
  ArrowRight,
  Receipt,
  BadgeCheck
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { apiRequest } from '@/lib/api';
import { Product, Customer, Sale } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function EmployeeWorkspacePage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // In-store Catalog & Customers
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [stockLookupSearch, setStockLookupSearch] = useState('');

  // Cart & POS Ticket
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Telebirr' | 'CBE Birr'>('Cash');
  const [notes, setNotes] = useState('');
  const [processingSale, setProcessingSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<Sale | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);

  // My Shift Sales
  const [mySales, setMySales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const currencySymbol = user?.currency_symbol || 'Br';

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [prodsData, custsData] = await Promise.all([
        apiRequest<Product[]>('/products'),
        apiRequest<Customer[]>('/customers'),
      ]);
      setProducts(prodsData.filter((p) => p.is_verified));
      setCustomers(custsData.filter((c) => c.is_verified));
    } catch (err) {
      console.error('Failed to load employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMySales = async () => {
    try {
      setLoadingSales(true);
      const allSales = await apiRequest<Sale[]>('/sales');
      // Filter sales processed by this employee
      const filtered = allSales.filter((s) => s.user_id === user?.id);
      setMySales(filtered);
    } catch (err) {
      console.error('Failed to load employee sales:', err);
    } finally {
      setLoadingSales(false);
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
      loadInitialData();
      loadMySales();
    }
  }, [user, authLoading, router]);

  // Cart Operations
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Cannot add more. Only ${product.stock_quantity} available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock_quantity) {
              alert(`Only ${item.product.stock_quantity} available in stock.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Submit In-Store Cashier Sale
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setProcessingSale(true);
    setSaleError(null);

    try {
      const payload = {
        customer_id: selectedCustomerId || undefined,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      };

      const res = await apiRequest<Sale>('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSaleSuccess(res);
      setCart([]);
      setNotes('');
      // Reload products to refresh stock & sales
      loadInitialData();
      loadMySales();
    } catch (err: any) {
      setSaleError(err.message || 'Transaction failed. Please check product stock.');
    } finally {
      setProcessingSale(false);
    }
  };

  // Print Slip
  const handlePrintReceipt = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Sale #${sale.id}</title>
          <style>
            body { font-family: monospace; padding: 18px; max-width: 320px; margin: auto; }
            h2 { text-align: center; margin: 0 0 4px; font-size: 16px; }
            .sub { text-align: center; font-size: 11px; margin-bottom: 12px; }
            .meta { font-size: 11px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 8px; }
            table { width: 100%; font-size: 11px; border-collapse: collapse; }
            th, td { text-align: left; padding: 4px 0; }
            .total { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; margin-top: 8px; padding-top: 6px; text-align: right; }
            .foot { text-align: center; font-size: 10px; margin-top: 14px; }
          </style>
        </head>
        <body>
          <h2>${user?.business_name || 'Retail Store'}</h2>
          <div class="sub">IN-STORE CASHIER RECEIPT • SALE #${sale.id}</div>
          <div class="meta">
            <div>Cashier: ${user?.name || 'Staff'}</div>
            <div>Customer: ${sale.customer_name || 'Walk-in Customer'}</div>
            <div>Payment: ${sale.payment_method}</div>
            <div>Date: ${new Date(sale.created_at).toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th style="text-align:right">Price</th></tr>
            </thead>
            <tbody>
              ${sale.items.map(i => `
                <tr>
                  <td>${i.product_name}</td>
                  <td>${i.quantity}</td>
                  <td style="text-align:right">${currencySymbol} ${i.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Total: ${currencySymbol} ${sale.total_amount.toFixed(2)}</div>
          <div class="foot">Thank you for shopping with us! Please come again.</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Products for Cashier Ticket
  const filteredProducts = products.filter((p) => {
    const s = productSearch.toLowerCase().trim();
    return !s || p.name.toLowerCase().includes(s) || (p.category_name && p.category_name.toLowerCase().includes(s));
  });

  // Filtered Products for Live Stock Lookup
  const stockLookupProducts = products.filter((p) => {
    const s = stockLookupSearch.toLowerCase().trim();
    return !s || p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s));
  });

  // Shift Statistics for this Employee
  const mySalesCount = mySales.length;
  const myRevenueTotal = mySales.reduce((sum, s) => sum + s.total_amount, 0);
  const myUnitsTotal = mySales.reduce((sum, s) => sum + s.items.reduce((sub, i) => sub + i.quantity, 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={t('nav_sales', 'Staff Sales & Cashier Counter')} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Employee Shift Header */}
          <div className="rounded-3xl border border-emerald-200/90 dark:border-emerald-800 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-md shadow-emerald-700/15 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs mb-2">
                  <BadgeCheck className="h-4 w-4" />
                  <span>{language === 'am' ? 'የመደብር ሰራተኛ ተርሚናል' : 'In-Store Staff Terminal'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {language === 'am' ? `እንኳን ደህና መጡ፣ ${user?.name || 'ሰራተኛ'}` : `Welcome, ${user?.name || 'Staff Member'}`}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                  {language === 'am' 
                    ? 'የሽያጭ መመዝገቢያ • የመደብር ሽያጭ ይፈጽሙ፣ የቀጥታ ክምችት ያረጋግጡና ደረሰኝ ያትሙ።' 
                    : 'Active Shift Counter • Process in-store sales, check live shelf stock, and print receipts.'}
                </p>
              </div>

              {/* Shift Stats */}
              <div className="grid grid-cols-3 gap-3 bg-black/20 p-3.5 rounded-2xl backdrop-blur-xs text-center border border-white/10">
                <div>
                  <span className="text-[10px] text-emerald-200 uppercase font-bold block">
                    {language === 'am' ? 'የእኔ ሽያጮች' : 'My Sales'}
                  </span>
                  <span className="text-xl font-black">{mySalesCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-200 uppercase font-bold block">
                    {language === 'am' ? 'የእኔ ገቢ' : 'My Revenue'}
                  </span>
                  <span className="text-xl font-black">{currencySymbol} {myRevenueTotal.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-200 uppercase font-bold block">
                    {language === 'am' ? 'የተሸጡ ዕቃዎች' : 'Units Sold'}
                  </span>
                  <span className="text-xl font-black">{myUnitsTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: POS Cashier Terminal & Fast Stock Lookup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: In-Store Product Catalog */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center">
                    <Package className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {language === 'am' ? 'በመደብር ውስጥ ያሉ ምርቶች' : 'In-Store Inventory Products'}
                  </h3>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder={language === 'am' ? 'ምርት ይፈልጉ...' : 'Search product...'}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-9 pr-3 py-1.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    {language === 'am' ? 'ምንም የሚዛመድ ምርት አልተገኘም።' : 'No verified products match your search.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {filteredProducts.map((p) => {
                      const isOutOfStock = p.stock_quantity <= 0;
                      return (
                        <button
                          key={p.id}
                          disabled={isOutOfStock}
                          onClick={() => addToCart(p)}
                          className={`rounded-2xl border p-3 text-left transition flex flex-col justify-between cursor-pointer ${
                            isOutOfStock
                              ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-50 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs'
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate">
                              {p.category_name || (language === 'am' ? 'አጠቃላይ' : 'General')}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block line-clamp-2 mt-0.5">
                              {p.name}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                              {currencySymbol} {p.price.toFixed(2)}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              isOutOfStock 
                                ? 'text-red-500 dark:text-red-400' 
                                : p.stock_quantity <= p.low_stock_threshold 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {isOutOfStock ? (language === 'am' ? 'አልቋል' : 'Empty') : `${p.stock_quantity} ${language === 'am' ? 'ቀሪ' : 'left'}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Shelf Price & Stock Check Accordion */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center">
                    <Tag className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    {language === 'am' ? 'የቀጥታ ዋጋና ክምችት ማረጋገጫ (የመደርደሪያ ፍተሻ)' : 'Live Price & Stock Lookup (Shelf Check)'}
                  </h4>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {language === 'am' ? 'ባርኮድ ወይም ስም ይፈልጉ' : 'Search product barcode / name'}
                  </span>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder={language === 'am' ? 'ትክክለኛውን የቀረ ክምችትና ዋጋ ለማወቅ የምርት ስም ይጻፉ...' : 'Type name to check exact remaining stock & price...'}
                    value={stockLookupSearch}
                    onChange={(e) => setStockLookupSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-9 pr-3 py-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {stockLookupSearch.trim() && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {stockLookupProducts.slice(0, 5).map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs border border-slate-100 dark:border-slate-700"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{prod.name}</span>
                        <div className="flex items-center space-x-3">
                          <span className="font-black text-emerald-700 dark:text-emerald-400">
                            {currencySymbol} {prod.price.toFixed(2)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            prod.stock_quantity <= 0 ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {prod.stock_quantity} {language === 'am' ? 'በክምችት አለ' : 'in stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 cols: Active POS Cashier Ticket */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center">
                    <Receipt className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {language === 'am' ? 'የአሁኑ የሽያጭ ትኬት' : 'Current In-Store Ticket'}
                  </h3>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-xs text-slate-400 hover:text-red-600 transition cursor-pointer"
                    >
                      {t('btn_cancel', 'Clear')}
                    </button>
                  )}
                </div>

                {saleError && (
                  <div className="my-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-2.5 text-xs text-red-700 dark:text-red-400 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{saleError}</span>
                  </div>
                )}

                {/* Ticket Items List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 my-3 max-h-56 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      {language === 'am' 
                        ? 'ትኬቱ ባዶ ነው። በግራ በኩል ካለው ዝርዝር ምርቶችን ይምረጡ።' 
                        : 'Ticket is empty. Click items from the catalog on the left to add them to this sale.'}
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                          <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                            {currencySymbol} {item.product.price.toFixed(2)} {language === 'am' ? 'በአንዱ' : 'each'}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-black text-slate-800 dark:text-slate-200 w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="rounded-lg p-1 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 ml-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Ticket Form & Customer Info */}
                <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {t('label_customer', 'Customer')} ({language === 'am' ? 'አማራጭ' : 'Optional'})
                    </label>
                    <select
                      value={selectedCustomerId || ''}
                      onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 font-medium focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">{language === 'am' ? 'መደበኛ ደንበኛ (Walk-in)' : 'Walk-in Customer'}</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {t('payment_method', 'Payment Mode')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Cash', 'Telebirr', 'CBE Birr'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-xl py-2 font-bold text-xs transition border cursor-pointer ${
                            paymentMethod === method
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {method === 'Cash' ? (language === 'am' ? 'ጥሬ ገንዘብ' : 'Cash') : method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total and Submit */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      {language === 'am' ? 'የትኬት ድምር:' : 'Ticket Total:'}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {currencySymbol} {cartTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={processingSale || cart.length === 0}
                    className="w-full flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
                  >
                    {processingSale ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === 'am' ? 'ሽያጩ በመመዝገብ ላይ...' : 'Recording Sale...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {language === 'am' ? `ሽያጭ አጠናቅቅ (${currencySymbol} ${cartTotal.toFixed(2)})` : `Complete Sale (${currencySymbol} ${cartTotal.toFixed(2)})`}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* My Recent Shift Sales List */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {language === 'am' ? `የእኔ የስራ ፈረቃ ሽያጮች (${mySales.length})` : `My Shift Sales (${mySales.length})`}
                  </h4>
                  <button
                    onClick={loadMySales}
                    disabled={loadingSales}
                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                    title={t('btn_refresh', 'Refresh')}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingSales ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {mySales.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
                    {language === 'am' ? 'በዚህ ፈረቃ እስካሁን ምንም ሽያጭ አልተመዘገበም።' : 'No sales recorded by you yet during this shift.'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {mySales.slice(0, 6).map((sale) => (
                      <div
                        key={sale.id}
                        className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">#{sale.id}</span>
                            <span className="text-slate-400 dark:text-slate-500">•</span>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                              {sale.customer_name || (language === 'am' ? 'መደበኛ' : 'Walk-in')}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.payment_method}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 dark:text-white">
                            {currencySymbol} {sale.total_amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handlePrintReceipt(sale)}
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Reprint receipt"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Sale Success Modal */}
      {saleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-3 py-1 text-xs font-black uppercase border border-emerald-200 dark:border-emerald-800">
              {language === 'am' ? `ሽያጭ #${saleSuccess.id} ተመዝግቧል` : `Sale #${saleSuccess.id} Recorded`}
            </span>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
              {language === 'am' ? 'ሽያጩ በተሳካ ሁኔታ ተጠናቋል!' : 'Sale Completed!'}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'am' ? 'ጠቅላላ መጠን:' : 'Total Amount:'} <strong>{currencySymbol} {saleSuccess.total_amount.toFixed(2)}</strong> ({saleSuccess.payment_method})
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => handlePrintReceipt(saleSuccess)}
                className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition cursor-pointer"
              >
                <Printer className="mr-1.5 h-4 w-4" />
                {language === 'am' ? 'ደረሰኝ አትም' : 'Print Cashier Receipt'}
              </button>

              <button
                onClick={() => setSaleSuccess(null)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {language === 'am' ? 'ቀጣይ ደንበኛ' : 'Next Customer Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
