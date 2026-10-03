'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Store, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp,
  Package,
  Users,
  BadgeAlert,
  Coins,
  Receipt,
  Check,
  Building2,
  Lock,
  ShoppingBag
} from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface PublicStoreData {
  business: {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    currency: string;
    currency_symbol: string;
  };
}

export default function LandingPage() {
  const { user } = useAuth();

  // Store data state
  const [storeData, setStoreData] = useState<PublicStoreData | null>(null);

  const loadStoreData = async () => {
    try {
      const data = await apiRequest<PublicStoreData>('/public/store');
      setStoreData(data);
    } catch (err) {
      console.error('Failed to load store data:', err);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  const storeName = storeData?.business.name || 'Retail & Business Management System';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:bg-emerald-500 transition">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                {storeName}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider block">
                Point of Sale & Business Operations
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3 sm:space-x-5">
            <a
              href="#features"
              className="hidden md:inline-flex text-xs font-bold text-slate-600 hover:text-emerald-700 transition px-2 py-1"
            >
              Key Features
            </a>

            <a
              href="#hierarchy"
              className="hidden md:inline-flex text-xs font-bold text-slate-600 hover:text-emerald-700 transition px-2 py-1"
            >
              Staff Roles
            </a>

            <a
              href="#reports"
              className="hidden md:inline-flex text-xs font-bold text-slate-600 hover:text-emerald-700 transition px-2 py-1"
            >
              Daily Reports
            </a>

            <Link
              href="/shop"
              className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
              <span>Shop Online</span>
            </Link>


            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              >
                Dashboard
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
                >
                  Staff Portal
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  Register Store
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 px-4 sm:px-6 bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 mb-6 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Multi-Tier Staff Hierarchy • POS Terminal • Automated Daily Reconciliation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Unified Retail Operations & <span className="text-emerald-600">Business Management</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Designed for retail stores, supermarkets, and enterprise merchants. Empower cashiers with fast POS sales, maintain verified inventory with automatic zero-stock alerts, delegate operational tasks to co-managers, and review automated daily financial reconciliation.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.01] transition"
              >
                Go to Store Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.01] transition"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Staff Portal Sign In
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <Building2 className="mr-2 h-4 w-4 text-slate-500" />
                  Register New Store
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                >
                  <ShoppingBag className="mr-2 h-4 w-4 text-emerald-600" />
                  Order Online
                </Link>

              </>
            )}
          </div>

          {/* Quick Pillars Grid */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 w-fit mb-3">
                <Receipt className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900">Point of Sale (POS)</h4>
              <p className="text-[11px] text-slate-500 mt-1">Instant sales processing, barcode search & receipts</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 w-fit mb-3">
                <BadgeAlert className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900">Zero-Stock Alerts</h4>
              <p className="text-[11px] text-slate-500 mt-1">Automatic 'EMPTY' status when items reach 0 stock</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 w-fit mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900">Staff Hierarchy</h4>
              <p className="text-[11px] text-slate-500 mt-1">Admin oversight, Co-Manager delegation & Cashier roles</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 w-fit mb-3">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900">Daily Reconciliation</h4>
              <p className="text-[11px] text-slate-500 mt-1">End-of-day revenue, sold quantity & remaining stock</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: SYSTEM CAPABILITIES & FEATURES */}
      {/* ========================================================================= */}
      <section id="features" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
            Core Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Engineered for Precision & Accountability
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Every transaction, price update, and stock movement is verified and audited across your business hierarchy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-emerald-300 transition">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Point of Sale Cashier Terminal</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Fast, intuitive cashier sales screen with instant search, quantity adjustment, customer loyalty attachment, and receipt generation. Reduces checkout bottlenecks while deducting inventory instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-300 transition">
            <div className="h-11 w-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4">
              <Package className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Verified Catalog & Stock Control</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Structured category organization, cost-to-retail profit margin tracking, and automated inventory labeling: items with 0 stock are immediately marked <strong>EMPTY</strong> to prevent overselling.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-purple-300 transition">
            <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-4">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Managerial Delegation & Approvals</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Co-Managers can add products and manage operational flow. All co-manager modifications automatically trigger alerts for the Store Owner, and employee price/product changes require authorization before going live.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-300 transition">
            <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Daily Reconciliation</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Comprehensive daily reports accessible on the admin dashboard calculating total sales revenue, units sold, remaining stock count, gross margins, and payment method breakdowns.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-300 transition">
            <div className="h-11 w-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Audit Logs & Notification Bell</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              The admin header notification center keeps store owners in full sync. Filter notifications by Co-Manager activity, view detailed audit logs, and delete archived logs when needed.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-300 transition">
            <div className="h-11 w-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-4">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Currency & Business Settings</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Admin-exclusive business profile controls. Configure Ethiopian Birr (ETB) by default or select from common international currencies (USD, EUR, GBP), tax rates, and store contact info.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: 3-TIER ROLE HIERARCHY */}
      {/* ========================================================================= */}
      <section id="hierarchy" className="py-16 bg-white border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
              Staff Roles & Permissions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Balanced Governance for Store Teams
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every staff member operates inside an optimized role with explicit responsibilities and verification safety nets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Card */}
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-black uppercase">
                    Highest Authority
                  </span>
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Store Administrator</h3>
                <p className="text-xs text-slate-600 mt-1">Store Owner & Executive Manager</p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                    <span>Full business profile & multi-currency selection</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                    <span>Real-time notification bell for co-manager actions</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                    <span>Activity audit logs with report deletion capability</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                    <span>End-of-day financial reconciliation reports</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                    <span>Final approval for deletion & profile update requests</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-200/70">
                <span className="text-[11px] text-emerald-800 font-bold block">
                  Access: Full Store Dashboard & Admin Console
                </span>
              </div>
            </div>

            {/* Co-Manager Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 text-[11px] font-black uppercase">
                    Operational Lead
                  </span>
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Co-Manager</h3>
                <p className="text-xs text-slate-600 mt-1">Floor Supervisor & Shift Manager</p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
                    <span>Add products, set pricing & register customers directly</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
                    <span>All actions logged & notified to admin automatically</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
                    <span>Can approve cashier/employee catalog modifications</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
                    <span>Deletions & personal profile updates require admin review</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-[11px] text-blue-700 font-bold block">
                  Access: Catalog, Sales, Approvals & Personal Profile
                </span>
              </div>
            </div>

            {/* Cashier / Employee Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 text-[11px] font-black uppercase">
                    Frontline Staff
                  </span>
                  <Receipt className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Employee / Cashier</h3>
                <p className="text-xs text-slate-600 mt-1">POS Sales Execution & Customer Service</p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-slate-600 mr-2 shrink-0 mt-0.5" />
                    <span>High-speed POS sales terminal operation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-slate-600 mr-2 shrink-0 mt-0.5" />
                    <span>Customer lookup and registration at checkout</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-slate-600 mr-2 shrink-0 mt-0.5" />
                    <span>Product and price change requests held for approval</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-slate-600 mr-2 shrink-0 mt-0.5" />
                    <span>Personal profile edit requires manager approval</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-600 font-bold block">
                  Access: POS Station, Customer Roster & Assigned Workspace
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: DAILY RECONCILIATION HIGHLIGHT */}
      {/* ========================================================================= */}
      <section id="reports" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
          <div className="max-w-3xl">
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider inline-block mb-3">
              Automated Financial Intelligence
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Daily Operations & Sales Reconciliation
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Every day at closing, administrators and managers get clear, actionable numbers without manual tallying or spreadsheet errors:
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Gross Daily Sales</span>
              <p className="text-xl font-black text-emerald-400 mt-1">Exact Revenue</p>
              <p className="text-[11px] text-slate-400 mt-1">Calculated from verified POS orders</p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Sales Volume</span>
              <p className="text-xl font-black text-white mt-1">Units Sold</p>
              <p className="text-[11px] text-slate-400 mt-1">Quantities deducted per product category</p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Inventory Status</span>
              <p className="text-xl font-black text-amber-400 mt-1">Remaining Stock</p>
              <p className="text-[11px] text-slate-400 mt-1">Automated alert on empty items</p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Payment Breakdown</span>
              <p className="text-xl font-black text-blue-400 mt-1">Cash / Card / Mobile</p>
              <p className="text-[11px] text-slate-400 mt-1">Reconciliation by payment method</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="py-16 bg-white border-t border-slate-200 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Ready to Manage Your Retail Store?
          </h2>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Sign in with your staff username to access the register, catalog manager, approval requests, and financial reports.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
            >
              Sign In to Staff Portal
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>

            {!user && (
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                Register Business Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white block text-sm">{storeName}</span>
              <span>Retail ERP, POS & Business Operations Platform</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#hierarchy" className="hover:text-white transition">Staff Hierarchy</a>
            <a href="#reports" className="hover:text-white transition">Daily Reports</a>
            <Link href="/shop" className="hover:text-white transition text-emerald-400 font-bold">Online Store</Link>
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
