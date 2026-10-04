'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Store, 
  ShoppingCart, 
  ArrowRight, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Phone, 
  MapPin, 
  X, 
  Loader2, 
  Sparkles,
  Package,
  ChevronRight,
  ShoppingBag,
  Upload,
  FileText,
  Image as ImageIcon,
  Check,
  Camera,
  User as UserIcon,
  Lock,
  LogOut,
  History,
  CheckCheck,
  ExternalLink,
  Copy,
  Smartphone,
  Building2,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useLanguage } from '@/lib/language';
import { CustomerUser, Sale } from '@/types';

interface PublicProduct {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  category_id?: number | null;
  category_name: string;
  stock_status: 'IN STOCK' | 'LOW STOCK' | 'EMPTY' | string;
  is_available: boolean;
}

interface PublicCategory {
  id: number;
  name: string;
}

interface PublicStoreData {
  business: {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    currency: string;
    currency_symbol: string;
    payment_phone?: string | null;
    payment_account_name?: string | null;
    cbe_account?: string | null;
    other_bank_info?: string | null;
    payment_instructions?: string | null;
  };
  categories: PublicCategory[];
  products: PublicProduct[];
}

interface CartItem {
  product: PublicProduct;
  quantity: number;
}

function ShopContent() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const searchParams = useSearchParams();
  const storeParam = searchParams.get('store') || searchParams.get('business_id');

  // Store data state
  const [storeData, setStoreData] = useState<PublicStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Drawer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Customer Authentication State
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);

  // My Orders & Delivery Tracking State
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<Sale[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [manualTrackingPhone, setManualTrackingPhone] = useState('');

  // Delivery Acknowledgment Proof Photo Modal
  const [proofModalOrder, setProofModalOrder] = useState<Sale | null>(null);
  const [proofImageFile, setProofImageFile] = useState<{
    dataUrl: string;
    fileName: string;
    sizeKb: number;
  } | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofSuccess, setProofSuccess] = useState(false);

  // Customer Checkout Form & Bank Receipt
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    payment_method: 'Telebirr',
    payment_ref: '',
    notes: '',
  });

  const [receiptFile, setReceiptFile] = useState<{
    dataUrl: string;
    fileName: string;
    fileType: string;
    fileSizeKb: number;
  } | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Store Payment Accounts Modal & Quick Copy State
  const [isPaymentAccountsOpen, setIsPaymentAccountsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Load customer profile from storage on start
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bms_customer_user');
      if (saved) {
        const parsed: CustomerUser = JSON.parse(saved);
        setCustomerUser(parsed);
        setCheckoutForm((prev) => ({
          ...prev,
          customer_name: parsed.name,
          customer_phone: parsed.phone,
          delivery_address: parsed.address || prev.delivery_address,
        }));
      }
    } catch (e) {
      // ignore
    } finally {
      setAuthChecking(false);
    }
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const endpoint = storeParam ? `/public/store?business_id=${storeParam}` : '/public/store';
      const data = await apiRequest<PublicStoreData>(endpoint);
      setStoreData(data);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [storeParam]);

  // Load customer's orders
  const loadMyOrders = async (phoneToUse?: string) => {
    const phone = phoneToUse || customerUser?.phone || manualTrackingPhone.trim() || checkoutForm.customer_phone;
    if (!phone) return;
    try {
      setLoadingMyOrders(true);
      const bizId = storeData?.business.id;
      const url = bizId
        ? `/public/customer/orders?phone=${encodeURIComponent(phone)}&business_id=${bizId}`
        : `/public/customer/orders?phone=${encodeURIComponent(phone)}`;
      const orders = await apiRequest<Sale[]>(url);
      setMyOrders(orders);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoadingMyOrders(false);
    }
  };

  // Customer Login
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone.trim() || !authPassword) {
      setAuthError('Please enter your phone number and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);
    try {
      const res = await apiRequest<{ status: string; customer: CustomerUser }>('/public/customer/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: authPhone.trim(),
          password: authPassword,
          business_id: storeData?.business.id,
        }),
      });
      setCustomerUser(res.customer);
      localStorage.setItem('bms_customer_user', JSON.stringify(res.customer));
      setCheckoutForm((prev) => ({
        ...prev,
        customer_name: res.customer.name,
        customer_phone: res.customer.phone,
        delivery_address: res.customer.address || prev.delivery_address,
      }));
      setAuthModalOpen(false);
      loadMyOrders(res.customer.phone);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check phone and password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Customer Register - Redirect to Login
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim() || !authPhone.trim() || !authPassword) {
      setAuthError('Please provide your name, phone number, and a password (min 6 chars).');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);
    try {
      const res = await apiRequest<{ status: string; customer: CustomerUser }>('/public/customer/register', {
        method: 'POST',
        body: JSON.stringify({
          name: authName.trim(),
          phone: authPhone.trim(),
          email: authEmail.trim() || undefined,
          address: authAddress.trim() || undefined,
          password: authPassword,
          business_id: storeData?.business.id,
        }),
      });

      // Redirect directly to login tab, pre-fill phone number, and require manual sign-in
      const registeredPhone = res.customer.phone;
      setAuthTab('login');
      setAuthPhone(registeredPhone);
      setAuthPassword('');
      setAuthName('');
      setAuthAddress('');
      setAuthEmail('');
      setAuthSuccessMessage('Registration Successful! Your customer account has been created. Please sign in with your phone number and password to enter the store.');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCustomerLogout = () => {
    localStorage.removeItem('bms_customer_user');
    setCustomerUser(null);
    setMyOrders([]);
  };

  // Receipt Upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setReceiptError('Receipt file size exceeds 5MB limit. Please upload a smaller image or PDF.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setReceiptError('Please upload an image screenshot (PNG, JPG, WebP) or PDF statement.');
      return;
    }

    setReceiptError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptFile({
        dataUrl: reader.result as string,
        fileName: file.name,
        fileType: file.type,
        fileSizeKb: Math.round(file.size / 1024)
      });
    };
    reader.readAsDataURL(file);
  };

  // Delivery Proof Photo Upload
  const handleProofPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProofError('Photo size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofImageFile({
        dataUrl: reader.result as string,
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
      });
      setProofError(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit Delivery Acknowledgment Proof
  const handleSubmitDeliveryProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofModalOrder || !proofImageFile) {
      setProofError('Please attach a photo of your received product or package.');
      return;
    }
    setSubmittingProof(true);
    setProofError(null);
    try {
      const phone = customerUser?.phone || checkoutForm.customer_phone || proofModalOrder.customer_phone || '';
      const res = await apiRequest<{ status: string; order: Sale }>(`/public/orders/${proofModalOrder.id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({
          customer_phone: phone,
          proof_image: proofImageFile.dataUrl,
          notes: proofNotes.trim() || undefined,
        }),
      });
      setProofSuccess(true);
      setMyOrders((prev) => prev.map((o) => (o.id === proofModalOrder.id ? res.order : o)));
      setTimeout(() => {
        setProofModalOrder(null);
        setProofSuccess(false);
        setProofImageFile(null);
        setProofNotes('');
      }, 1800);
    } catch (err: any) {
      setProofError(err.message || 'Failed to submit proof. Please verify phone number.');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Cart management
  const addToCart = (product: PublicProduct) => {
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
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock_quantity) {
              alert(`Only ${item.product.stock_quantity} units available in stock.`);
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
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Online Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutForm.customer_name.trim() || !checkoutForm.customer_phone.trim() || !checkoutForm.delivery_address.trim()) {
      setOrderError('Please provide your full name, phone number, and delivery address.');
      return;
    }

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      const payload = {
        business_id: storeData?.business.id,
        customer_name: checkoutForm.customer_name.trim(),
        customer_phone: checkoutForm.customer_phone.trim(),
        delivery_address: checkoutForm.delivery_address.trim(),
        payment_method: checkoutForm.payment_method,
        payment_ref: checkoutForm.payment_ref.trim() || undefined,
        payment_receipt: receiptFile?.dataUrl || undefined,
        notes: checkoutForm.notes.trim() || undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await apiRequest<any>('/public/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setOrderSuccess(res);
      setCart([]);
      setReceiptFile(null);
      setIsCartOpen(false);
      loadStoreData();
      if (customerUser) {
        loadMyOrders(customerUser.phone);
      }
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place your order. Please check item stock.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const currencySymbol = storeData?.business.currency_symbol || 'Br';
  const storeName = storeData?.business.name || 'Store';

  // Filter products
  const filteredProducts = (storeData?.products || []).filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'uncategorized' && !p.category_name) ||
      p.category_name.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading {storeName || 'Online Store'}...
        </p>
      </div>
    );
  }

  // Mandatory Customer Sign-In Gate:
  // The online order products and catalog are only visible after customer signs in.
  if (!customerUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-200">
        {/* Top Header */}
        <header className="border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:bg-emerald-500 transition">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
                  {storeName}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                  {t('shop_title', 'Customer Online Portal')}
                </span>
              </div>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Dual Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                title={language === 'en' ? "ወደ አማርኛ ቀይር" : "Switch to English"}
              >
                <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}</span>
              </button>

              {/* Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" />
                )}
              </button>
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Staff Portal
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  Staff Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Center Auth Card */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 mb-3 shadow-xs">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Customer Sign-In Required</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sign In to Order Online
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                Welcome to <strong>{storeName}</strong>! Please sign in or create a customer account to browse products and place delivery orders.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setAuthError(null);
                  }}
                  className={`py-2.5 rounded-xl transition cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In to Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setAuthError(null);
                  }}
                  className={`py-2.5 rounded-xl transition cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authSuccessMessage && (
                <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs text-emerald-900 flex items-start space-x-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Account Created Successfully!</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">{authSuccessMessage}</p>
                  </div>
                </div>
              )}

              {authError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  {authError}
                </div>
              )}

              {/* Login Form */}
              {authTab === 'login' ? (
                <form onSubmit={handleCustomerLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Customer Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="0911 22 33 44"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {authLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <>
                        <span>Sign In & Open Store</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('register');
                        setAuthError(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      New customer? Create your free account here
                    </button>
                  </div>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleCustomerRegister} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Abebe Bikila"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Mobile Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="0911 22 33 44"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Delivery Address / Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Bole Subcity, Woreda 03, Addis Ababa"
                        value={authAddress}
                        onChange={(e) => setAuthAddress(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Password (min 6 characters) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {authLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <>
                        <span>Create Account & Start Ordering</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('login');
                        setAuthError(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Already have an account? Sign in here
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Value props */}
            <div className="mt-8 grid grid-cols-3 gap-3 text-center text-slate-500">
              <div className="bg-white/80 p-3 rounded-2xl border border-slate-200 shadow-xs">
                <Truck className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-800 block">Fast Delivery</span>
                <span className="text-[10px]">Direct to door</span>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-slate-200 shadow-xs">
                <CreditCard className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-800 block">Easy Pay</span>
                <span className="text-[10px]">Telebirr & CBE Birr</span>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-slate-200 shadow-xs">
                <Camera className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-800 block">Photo Proof</span>
                <span className="text-[10px]">Receipt confirmation</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
          <span>© {new Date().getFullYear()} {storeName} • Customer Online Delivery Store</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-600 selection:text-white font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:bg-emerald-500 transition">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
                {storeName}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                {t('shop_title', 'Online Shopping Storefront')}
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Dual Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              title={language === 'en' ? "ወደ አማርኛ ቀይር" : "Switch to English"}
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>

            {/* Store Payment Details Button */}
            <button
              onClick={() => setIsPaymentAccountsOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 px-3 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs cursor-pointer"
              title="View Telebirr and bank accounts for online transfer"
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden sm:inline">{t('nav_payment_accounts', 'Payment Accounts')}</span>
              <span className="sm:hidden">Pay Info</span>
            </button>

            {/* Customer Tracking / Orders Button */}
            <button
              onClick={() => {
                setIsMyOrdersOpen(true);
                loadMyOrders();
              }}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
            >
              <History className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('nav_track_orders', 'Track Orders')}</span>
            </button>

            {/* Customer Account Button */}
            <div className="inline-flex items-center space-x-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <UserIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate max-w-[120px]">{customerUser.name}</span>
              <button
                onClick={handleCustomerLogout}
                title="Sign out of customer account"
                className="text-slate-400 hover:text-red-600 ml-1.5 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition flex items-center space-x-1 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-[10px]">{t('btn_sign_out', 'Sign Out')}</span>
              </button>
            </div>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{t('nav_cart', 'Cart')}</span>
              {totalItemCount > 0 && (
                <span className="rounded-full bg-white text-emerald-800 px-2 py-0.5 text-[11px] font-black animate-pulse">
                  {totalItemCount}
                </span>
              )}
            </button>

            {user ? (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              >
                Staff Portal
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 pt-10 pb-12 px-4 sm:px-6 transition-colors">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-4 shadow-xs">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('shop_subtitle', 'Fast Local Delivery • Telebirr • CBE Birr • Cash on Delivery')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t('shop_title', 'Order Fresh Products Online')}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Browse verified stock from <strong>{storeName}</strong>. Add items to your cart, upload your payment statement, and acknowledge delivery directly online.
          </p>

          {/* Quick Value Props */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs flex items-center space-x-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Doorstep Delivery</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Same-day rider dispatch</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs flex items-center space-x-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Verified Stock</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Only verified fresh products</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs flex items-center space-x-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Proof of Receipt</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Acknowledge delivery with photo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {t('shop_all_categories', 'All Categories')}
            </button>
            {storeData?.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('btn_search', 'Search products...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 pl-10 pr-4 py-2 text-xs font-medium focus:border-emerald-500 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
            <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No products available in this category</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try switching to &quot;All Categories&quot; or clearing your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((p) => {
              const inCartItem = cart.find((i) => i.product.id === p.id);
              const isOutOfStock = p.stock_quantity <= 0;

              return (
                <div
                  key={p.id}
                  className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {p.category_name}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          isOutOfStock
                            ? 'text-red-600 dark:text-red-400'
                            : p.stock_status === 'LOW STOCK'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {isOutOfStock
                          ? t('status_empty', 'Out of stock')
                          : p.stock_status === 'LOW STOCK'
                          ? t('status_low_stock', 'Low Stock')
                          : `${p.stock_quantity} ${t('status_in_stock', 'In Stock')}`}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">{p.name}</h3>

                    {p.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('label_price', 'Price')}</span>
                      <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                        {currencySymbol} {p.price.toFixed(2)}
                      </span>
                    </div>

                    {isOutOfStock ? (
                      <span className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-400">
                        {t('status_empty', 'Unavailable')}
                      </span>
                    ) : inCartItem ? (
                      <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(p.id, -1)}
                          className="rounded-lg bg-white dark:bg-slate-800 p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 px-1">
                          {inCartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(p.id, 1)}
                          className="rounded-lg bg-white dark:bg-slate-800 p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p)}
                        className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition cursor-pointer"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {t('btn_add_to_cart', 'Add to Cart')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{t('nav_cart', 'Your Shopping Cart')}</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {orderError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300">
                    {orderError}
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                    <ShoppingCart className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    {t('shop_cart_empty', 'Your cart is empty. Add products from the store.')}
                  </div>
                ) : (
                  <>
                    {/* Cart Items List */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="truncate pr-2">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.product.name}</h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {currencySymbol} {item.product.price.toFixed(2)} each
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-black text-slate-800 dark:text-slate-100 w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="rounded-lg p-1 text-slate-400 hover:text-red-600 ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Subtotal */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t('label_subtotal', 'Order Subtotal:')}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {currencySymbol} {cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Customer Account Prompt in Checkout */}
                    {!customerUser && (
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 flex items-center justify-between text-xs">
                        <span className="text-emerald-900 dark:text-emerald-300">Have a customer account?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('login');
                            setAuthModalOpen(true);
                          }}
                          className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Sign In for Quick Checkout
                        </button>
                      </div>
                    )}

                    {/* Customer Checkout Form */}
                    <form id="orderForm" onSubmit={handlePlaceOrder} className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 block">Delivery & Contact Details:</span>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">{t('label_name', 'Your Full Name')} *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Abebe Kebede"
                          value={checkoutForm.customer_name}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">{t('label_phone', 'Phone Number')} *</label>
                        <input
                          type="text"
                          required
                          placeholder="0911 22 33 44"
                          value={checkoutForm.customer_phone}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_phone: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">{t('label_address', 'Delivery Address / Area')} *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Bole Medhanialem, Edna Mall Area"
                          value={checkoutForm.delivery_address}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_address: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">{t('payment_method', 'Payment Method')} *</label>
                        <select
                          value={checkoutForm.payment_method}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                        >
                          <option value="Telebirr">{t('payment_telebirr', 'Telebirr (Mobile Transfer / QR)')}</option>
                          <option value="CBE Birr">{t('payment_cbe_birr', 'CBE Birr (Mobile Transfer)')}</option>
                          <option value="Bank Transfer">{t('payment_bank_transfer', 'Commercial Bank / Awash / Dashen Bank Transfer')}</option>
                          <option value="Cash on Delivery">{t('payment_cash_on_delivery', 'Cash on Delivery')}</option>
                        </select>
                      </div>

                      {/* Interactive Payment Destination Card */}
                      {checkoutForm.payment_method === 'Telebirr' && (
                        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-3.5 space-y-2.5 shadow-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                              <Smartphone className="h-3 w-3" />
                              <span>Telebirr Transfer Details</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800">
                              Instant Transfer
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/95 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs">
                              <div className="truncate pr-2">
                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Telebirr Number</span>
                                <span className="font-mono font-black text-sm text-slate-900 block truncate">
                                  {storeData?.business.payment_phone || storeData?.business.phone || 'Contact Store'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(storeData?.business.payment_phone || storeData?.business.phone || '', 'telebirr_phone')}
                                className="inline-flex items-center space-x-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-1 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                              >
                                {copiedField === 'telebirr_phone' ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-700" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="bg-white/95 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs">
                              <div className="truncate pr-2">
                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Account Name</span>
                                <span className="font-bold text-xs text-slate-900 truncate block">
                                  {storeData?.business.payment_account_name || storeData?.business.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(storeData?.business.payment_account_name || storeData?.business.name || '', 'account_name')}
                                className="inline-flex items-center space-x-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-1 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                              >
                                {copiedField === 'account_name' ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-700" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="bg-emerald-100/70 p-2.5 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-emerald-900 block">Amount to Transfer:</span>
                              <span className="text-sm font-black text-emerald-950">
                                {currencySymbol} {cartTotal.toFixed(2)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(cartTotal.toFixed(2), 'cart_total')}
                              className="inline-flex items-center space-x-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 px-2.5 py-1 text-[11px] font-bold shadow-xs transition cursor-pointer"
                            >
                              {copiedField === 'cart_total' ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Amount Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Amount</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-[10px] text-emerald-900 leading-tight">
                            {storeData?.business.payment_instructions || 'Open Telebirr app > Send Money to this number > Enter exact amount > Copy transaction reference ID & attach receipt screenshot below.'}
                          </p>
                        </div>
                      )}

                      {checkoutForm.payment_method === 'CBE Birr' && (
                        <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white p-3.5 space-y-2.5 shadow-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center space-x-1.5 rounded-full bg-purple-700 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                              <CreditCard className="h-3 w-3" />
                              <span>CBE Birr Mobile Transfer</span>
                            </span>
                            <span className="text-[10px] font-bold text-purple-800">
                              Commercial Bank of Ethiopia
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/95 p-2.5 rounded-xl border border-purple-200 flex items-center justify-between shadow-2xs">
                              <div className="truncate pr-2">
                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">CBE Account / Phone</span>
                                <span className="font-mono font-black text-sm text-slate-900 block truncate">
                                  {storeData?.business.cbe_account || storeData?.business.payment_phone || storeData?.business.phone || 'Contact Store'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(storeData?.business.cbe_account || storeData?.business.payment_phone || storeData?.business.phone || '', 'cbe_phone')}
                                className="inline-flex items-center space-x-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 px-2 py-1 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                              >
                                {copiedField === 'cbe_phone' ? (
                                  <>
                                    <Check className="h-3 w-3 text-purple-700" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="bg-white/95 p-2.5 rounded-xl border border-purple-200 flex items-center justify-between shadow-2xs">
                              <div className="truncate pr-2">
                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Account Holder Name</span>
                                <span className="font-bold text-xs text-slate-900 truncate block">
                                  {storeData?.business.payment_account_name || storeData?.business.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(storeData?.business.payment_account_name || storeData?.business.name || '', 'account_name')}
                                className="inline-flex items-center space-x-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 px-2 py-1 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                              >
                                {copiedField === 'account_name' ? (
                                  <>
                                    <Check className="h-3 w-3 text-purple-700" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="bg-purple-100/70 p-2.5 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-purple-900 block">Amount to Transfer:</span>
                              <span className="text-sm font-black text-purple-950">
                                {currencySymbol} {cartTotal.toFixed(2)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(cartTotal.toFixed(2), 'cart_total')}
                              className="inline-flex items-center space-x-1 rounded-lg bg-purple-700 text-white hover:bg-purple-800 px-2.5 py-1 text-[11px] font-bold shadow-xs transition cursor-pointer"
                            >
                              {copiedField === 'cart_total' ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Amount Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Amount</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-[10px] text-purple-900 leading-tight">
                            {storeData?.business.payment_instructions || 'Open CBE Birr app or dial *847# to transfer. Paste your transaction reference ID and attach receipt screenshot below.'}
                          </p>
                        </div>
                      )}

                      {checkoutForm.payment_method === 'Bank Transfer' && (
                        <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-50 via-slate-50 to-white p-3.5 space-y-2.5 shadow-xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center space-x-1.5 rounded-full bg-blue-700 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                              <Building2 className="h-3 w-3" />
                              <span>Bank Account Transfer</span>
                            </span>
                            <span className="text-[10px] font-bold text-blue-800">
                              CBE & Other Banks
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="bg-white/95 p-2.5 rounded-xl border border-blue-200 flex items-center justify-between shadow-2xs">
                              <div className="truncate pr-2">
                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">CBE Account Number</span>
                                <span className="font-mono font-black text-sm text-slate-900 block truncate">
                                  {storeData?.business.cbe_account || 'Contact Store for CBE Account'}
                                </span>
                              </div>
                              {storeData?.business.cbe_account && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(storeData?.business.cbe_account || '', 'cbe_account')}
                                  className="inline-flex items-center space-x-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 px-2 py-1 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                                >
                                  {copiedField === 'cbe_account' ? (
                                    <>
                                      <Check className="h-3 w-3 text-blue-700" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="bg-white/95 p-2.5 rounded-xl border border-blue-200 flex items-center justify-between shadow-2xs">
                              <div className="truncate pr-2">
                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Account Recipient Name</span>
                                <span className="font-bold text-xs text-slate-900 truncate block">
                                  {storeData?.business.payment_account_name || storeData?.business.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(storeData?.business.payment_account_name || storeData?.business.name || '', 'account_name')}
                                className="inline-flex items-center space-x-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 px-2 py-1 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                              >
                                {copiedField === 'account_name' ? (
                                  <>
                                    <Check className="h-3 w-3 text-blue-700" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {storeData?.business.other_bank_info && (
                              <div className="bg-white/95 p-2.5 rounded-xl border border-blue-200 flex items-center justify-between shadow-2xs">
                                <div className="truncate pr-2">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Other Banks & Info</span>
                                  <span className="font-bold text-xs text-slate-800 block truncate">
                                    {storeData.business.other_bank_info}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(storeData?.business.other_bank_info || '', 'other_bank')}
                                  className="inline-flex items-center space-x-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 px-2 py-1 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                                >
                                  {copiedField === 'other_bank' ? (
                                    <>
                                      <Check className="h-3 w-3 text-blue-700" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="bg-blue-100/70 p-2.5 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-blue-900 block">Amount to Transfer:</span>
                              <span className="text-sm font-black text-blue-950">
                                {currencySymbol} {cartTotal.toFixed(2)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(cartTotal.toFixed(2), 'cart_total')}
                              className="inline-flex items-center space-x-1 rounded-lg bg-blue-700 text-white hover:bg-blue-800 px-2.5 py-1 text-[11px] font-bold shadow-xs transition cursor-pointer"
                            >
                              {copiedField === 'cart_total' ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Amount Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Amount</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-[10px] text-blue-900 leading-tight">
                            {storeData?.business.payment_instructions || 'Transfer funds through your bank app or branch. Upload your PDF statement or slip photo below for verification.'}
                          </p>
                        </div>
                      )}

                      {checkoutForm.payment_method === 'Cash on Delivery' && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 animate-in fade-in duration-200 text-xs">
                          <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                            <Truck className="h-4 w-4 text-emerald-600" />
                            <span>Cash on Delivery Selected</span>
                          </span>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            You can pay cash or transfer directly to our delivery courier when they arrive with your order. Advance receipt upload is not required!
                          </p>
                        </div>
                      )}

                      {/* Bank Statement & Receipt Upload Container */}
                      <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-3.5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-black text-emerald-950 flex items-center">
                              <ShieldCheck className="mr-1.5 h-4 w-4 text-emerald-600" />
                              Bank Receipt / Payment Statement
                            </span>
                            <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-snug">
                              Attach your payment screenshot (Telebirr/CBE Birr) or bank PDF statement. Admin & Co-Admin verify this to release your order to delivery.
                            </p>
                          </div>
                        </div>

                        {/* Transaction Reference Code */}
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-900">
                            Bank / Mobile Transaction Reference ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. CBE FT2409... or Telebirr TXN-789012"
                            value={checkoutForm.payment_ref}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, payment_ref: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>

                        {/* File Upload / Preview Box */}
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                            Payment Statement / Full Screenshot Receipt
                          </label>

                          {receiptFile ? (
                            <div className="rounded-xl border border-emerald-300 bg-white p-2.5 flex items-center justify-between">
                              <div className="flex items-center space-x-2.5 truncate">
                                {receiptFile.fileType.startsWith('image/') ? (
                                  <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                                    <img
                                      src={receiptFile.dataUrl}
                                      alt="Receipt Preview"
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                    PDF
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-800 truncate">
                                    {receiptFile.fileName}
                                  </p>
                                  <p className="text-[10px] text-emerald-700 font-semibold">
                                    {receiptFile.fileSizeKb} KB • Ready for Admin verification
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReceiptFile(null)}
                                className="ml-2 text-slate-400 hover:text-red-600 p-1 rounded-md transition cursor-pointer"
                                title="Remove statement"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300/80 bg-white p-3 text-center cursor-pointer hover:bg-emerald-50/50 transition group">
                              <Upload className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition" />
                              <span className="text-xs font-bold text-emerald-900 mt-1">
                                Click to Upload Receipt (Screenshot or PDF)
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                Supports PNG, JPG, WebP, or PDF bank statement up to 5MB
                              </span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                onChange={handleReceiptUpload}
                                className="hidden"
                              />
                            </label>
                          )}

                          {receiptError && (
                            <p className="text-[11px] text-red-600 font-bold mt-1">
                              {receiptError}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">{t('label_notes', 'Delivery Instructions / Notes')}</label>
                        <input
                          type="text"
                          placeholder="e.g. House #102, ring the bell on gate"
                          value={checkoutForm.notes}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </form>
                  </>
                )}
              </div>

              {/* Drawer Footer Submit */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <button
                    type="submit"
                    form="orderForm"
                    disabled={orderSubmitting}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                  >
                    {orderSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('btn_saving', 'Submitting Order & Receipt...')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t('btn_place_order', 'Confirm & Place Order')} ({currencySymbol} {cartTotal.toFixed(2)})
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Authentication Modal (Login & Register directly on shop page) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {authTab === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Track orders & confirm receipt</p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl my-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {authSuccessMessage && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-900 flex items-start space-x-2.5 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Account Created Successfully!</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">{authSuccessMessage}</p>
                </div>
              </div>
            )}

            {authError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                {authError}
              </div>
            )}

            {/* Login Form */}
            {authTab === 'login' ? (
              <form onSubmit={handleCustomerLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0911 22 33 44"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Sign In to My Account'}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleCustomerRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Almaz Tefera"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0911 22 33 44"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Default Delivery Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bole Medhanialem Area, Addis Ababa"
                    value={authAddress}
                    onChange={(e) => setAuthAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Create Password (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Account & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Customer My Orders & Delivery Tracking Drawer */}
      {isMyOrdersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMyOrdersOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">My Orders & Live Tracking</h3>
                    <p className="text-[11px] text-slate-500">Track delivery status & confirm receipt</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMyOrdersOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Search / Phone Input for Guest Tracking */}
                {!customerUser && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Lookup Orders by Phone Number:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Enter your phone number..."
                        value={manualTrackingPhone}
                        onChange={(e) => setManualTrackingPhone(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        onClick={() => loadMyOrders(manualTrackingPhone)}
                        className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                )}

                {loadingMyOrders ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    No orders found. Enter your phone number or sign in to track your deliveries.
                  </div>
                ) : (
                  myOrders.map((ord) => {
                    const isDispatched = ord.order_status === 'DISPATCHED';
                    const isDelivered = ord.order_status === 'DELIVERED';
                    const canAcknowledge = (isDispatched || isDelivered) && !ord.customer_acknowledged;

                    return (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                      >
                        {/* Top: Order ID & Status */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="font-black text-sm text-slate-900">Order #{ord.id}</span>
                            <span className="text-[11px] text-slate-400 ml-2">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${
                            ord.order_status === 'PENDING_VERIFICATION' || ord.order_status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.order_status === 'VERIFIED'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.order_status === 'DISPATCHED'
                              ? 'bg-purple-100 text-purple-800'
                              : ord.order_status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ord.order_status?.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="text-xs space-y-1">
                          {ord.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-slate-700">
                              <span>
                                <strong className="text-emerald-700 mr-1.5">{it.quantity}x</strong>
                                {it.product_name}
                              </span>
                              <span>{currencySymbol} {it.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Price & Ref */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Total: <strong className="text-slate-900">{currencySymbol} {ord.total_amount.toFixed(2)}</strong></span>
                          <span className="text-[11px] text-slate-400">{ord.payment_method}</span>
                        </div>

                        {/* Customer Delivery Acknowledgment Status / Action */}
                        {ord.customer_acknowledged ? (
                          <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-xs text-emerald-900 space-y-2">
                            <div className="flex items-center text-emerald-800 font-bold">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1.5" />
                              <span>You Confirmed Receipt of this Order</span>
                            </div>
                            {ord.delivery_proof_image && (
                              <div className="flex items-center space-x-3">
                                <img
                                  src={ord.delivery_proof_image}
                                  alt="Proof Photo"
                                  className="h-12 w-12 rounded-lg object-cover border border-emerald-300"
                                />
                                <span className="text-[11px] text-emerald-800/80">
                                  Proof photo safely sent to store admin.
                                </span>
                              </div>
                            )}
                            {ord.customer_feedback && (
                              <p className="text-[11px] italic text-emerald-800/90">
                                &quot;{ord.customer_feedback}&quot;
                              </p>
                            )}
                          </div>
                        ) : canAcknowledge ? (
                          <div className="rounded-2xl border border-purple-300 bg-purple-50/60 p-3.5 space-y-2">
                            <div className="flex items-center space-x-2 text-purple-900 font-black text-xs">
                              <Camera className="h-4 w-4 text-purple-600" />
                              <span>Order Reached You? Send Photo Proof to Admin</span>
                            </div>
                            <p className="text-[11px] text-purple-800/80 leading-snug">
                              Please snap or upload a photo showing the delivered items to acknowledge you received your order in good condition.
                            </p>
                            <button
                              onClick={() => setProofModalOrder(ord)}
                              className="w-full inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition cursor-pointer"
                            >
                              <Camera className="mr-1.5 h-3.5 w-3.5" />
                              Upload Received Photo & Confirm Receipt
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Delivery Proof Photo Upload Modal */}
      {proofModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Acknowledge Order #{proofModalOrder.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">Send photo proof of received items to Admin</p>
                </div>
              </div>
              <button
                onClick={() => setProofModalOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {proofSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Delivery Confirmed!</h4>
                <p className="text-xs text-slate-500">
                  Your proof photo and remarks have been forwarded to store management.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDeliveryProof} className="space-y-4 pt-4 text-xs">
                {proofError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                    {proofError}
                  </div>
                )}

                {/* Photo Upload Area */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Photo of Received Items / Package *
                  </label>

                  {proofImageFile ? (
                    <div className="rounded-2xl border border-purple-300 bg-purple-50/30 p-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3 truncate">
                        <img
                          src={proofImageFile.dataUrl}
                          alt="Proof preview"
                          className="h-14 w-14 rounded-xl object-cover border border-purple-200"
                        />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{proofImageFile.fileName}</p>
                          <p className="text-[10px] text-purple-700">{proofImageFile.sizeKb} KB • Photo attached</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProofImageFile(null)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/20 p-5 text-center cursor-pointer hover:bg-purple-50/50 transition group">
                      <Camera className="h-7 w-7 text-purple-600 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-purple-900 mt-2">
                        Take or Upload Photo of Items
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Snap camera photo or upload image up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleProofPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Your Remarks / Feedback (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received all items in good condition, thank you!"
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setProofModalOrder(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingProof || !proofImageFile}
                    className="rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-purple-500 disabled:opacity-50 transition cursor-pointer"
                  >
                    {submittingProof ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      'Send Proof to Admin & Complete'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="flex items-center justify-center space-x-2">
              <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-black uppercase">
                Order #{orderSuccess.order_id}
              </span>
              <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[11px] font-black uppercase">
                Pending Verification
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mt-3">
              Order Received, {orderSuccess.customer_name}!
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your order and bank payment statement have been securely submitted. 
              <strong> Store Admin & Co-Admin will review your receipt</strong> and release your order to our delivery driver.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-bold text-slate-800">{orderSuccess.delivery_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">{orderSuccess.payment_method}</span>
              </div>
              {orderSuccess.payment_ref && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Reference ID:</span>
                  <span className="font-mono font-bold text-emerald-700">{orderSuccess.payment_ref}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Attached:</span>
                <span className="font-bold text-slate-800">
                  {orderSuccess.has_receipt ? '✅ Statement / Screenshot Uploaded' : 'Cash / Pending on Delivery'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-900">Total:</span>
                <span className="font-black text-emerald-700">
                  {orderSuccess.currency_symbol} {orderSuccess.total_amount.toFixed(2)}
                </span>
              </div>

              {orderSuccess.payment_method !== 'Cash on Delivery' && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 text-xs">
                  <span className="text-[10px] font-black uppercase text-emerald-900 block">
                    Store Payment Transfer Details
                  </span>
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-[11px] text-slate-500">Account / Phone:</span>
                    <span className="font-mono font-bold text-emerald-950">
                      {storeData?.business.payment_phone || storeData?.business.cbe_account || storeData?.business.phone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-[11px] text-slate-500">Recipient Name:</span>
                    <span className="font-bold text-slate-900">
                      {storeData?.business.payment_account_name || storeData?.business.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col space-y-2">
              <button
                onClick={() => {
                  setOrderSuccess(null);
                  setIsMyOrdersOpen(true);
                  loadMyOrders(orderSuccess.customer_phone);
                }}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition cursor-pointer"
              >
                Track My Delivery
              </button>

              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Payment Accounts & Bank Details Modal */}
      {isPaymentAccountsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Store Payment Accounts</h3>
                  <p className="text-[11px] text-slate-500">Official Telebirr & Bank accounts</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentAccountsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {/* Telebirr */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center">
                    <Smartphone className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Telebirr Direct
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">Mobile Transfer</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="truncate pr-2">
                    <span className="text-[9px] uppercase text-slate-400 block font-bold">Merchant / Phone Number</span>
                    <span className="font-mono font-black text-sm text-slate-900 block truncate">
                      {storeData?.business.payment_phone || storeData?.business.phone || 'Contact Store'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(storeData?.business.payment_phone || storeData?.business.phone || '', 'modal_telebirr')}
                    className="inline-flex items-center space-x-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-1 text-xs font-bold transition flex-shrink-0 cursor-pointer"
                  >
                    {copiedField === 'modal_telebirr' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-700" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CBE Bank */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/40 border border-purple-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-purple-700" />
                    Commercial Bank of Ethiopia (CBE)
                  </span>
                  <span className="text-[10px] font-bold text-purple-700">Account / CBE Birr</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-purple-200 shadow-2xs">
                  <div className="truncate pr-2">
                    <span className="text-[9px] uppercase text-slate-400 block font-bold">Account Number</span>
                    <span className="font-mono font-black text-sm text-slate-900 block truncate">
                      {storeData?.business.cbe_account || 'Contact Store'}
                    </span>
                  </div>
                  {storeData?.business.cbe_account && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(storeData?.business.cbe_account || '', 'modal_cbe')}
                      className="inline-flex items-center space-x-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 px-2.5 py-1 text-xs font-bold transition flex-shrink-0 cursor-pointer"
                    >
                      {copiedField === 'modal_cbe' ? (
                        <>
                          <Check className="h-3 w-3 text-purple-700" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Recipient Account Name */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Recipient Name</span>
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {storeData?.business.payment_account_name || storeData?.business.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(storeData?.business.payment_account_name || storeData?.business.name || '', 'modal_name')}
                  className="inline-flex items-center space-x-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1 text-xs font-bold transition flex-shrink-0 cursor-pointer"
                >
                  {copiedField === 'modal_name' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-700" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Other Banks (if set) */}
              {storeData?.business.other_bank_info && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Other Banks Info</span>
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {storeData.business.other_bank_info}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(storeData?.business.other_bank_info || '', 'modal_other')}
                    className="inline-flex items-center space-x-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1 text-xs font-bold transition flex-shrink-0 cursor-pointer"
                  >
                    {copiedField === 'modal_other' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-700" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Instructions */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-snug">
                <span className="font-bold block mb-0.5">Instructions:</span>
                {storeData?.business.payment_instructions || 'Please transfer the exact amount for your order. After sending, enter your transaction reference number and upload your payment receipt at checkout.'}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentAccountsOpen(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 px-4 sm:px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white block text-sm">{storeName}</span>
              <span>Retail & Customer Online Delivery Store</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-white transition">About Store</Link>
            <Link href="/login" className="hover:text-white transition">Staff Sign In</Link>
            <Link href="/register" className="hover:text-white transition">Register Store</Link>
          </div>

          <div>
            <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
