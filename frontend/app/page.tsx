'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart,
  ShieldCheck,
  DollarSign,
  Lock,
  Sparkles,
  Layers,
  ChevronRight,
  AlertTriangle,
  Smartphone,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'audit'>('pos');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-500 transition">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block">
                Business Management System
              </span>
              <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                Retail & Inventory ERP • ETB
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-slate-700 hover:text-emerald-700 transition px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
                >
                  Register Business
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 mb-8 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Smart Retail Platform with Admin RBAC Authorization</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            The modern operating system for your <span className="text-emerald-600">retail store</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Take complete control of products, customers, and daily sales in Ethiopian Birr (ETB). Ring up transactions in seconds, prevent out-of-stock surprises, and protect your store with admin-approved employee deletion controls.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.01] transition"
            >
              Get Started — Register Store
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition"
            >
              Sign In to Existing Store
            </Link>
          </div>

          {/* Interactive Live Platform Showcase */}
          <div className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl max-w-4xl mx-auto text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Live Store Platform</span>
                <h3 className="text-lg font-extrabold text-slate-900">Unified Point of Sale & Security Hub</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'pos' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  POS & Sales Engine
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'audit' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Staff Audit & RBAC
                </button>
              </div>
            </div>

            {/* Tab 1: POS Engine Preview */}
            {activeTab === 'pos' && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-bold uppercase">Today's Revenue</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">18,450 ETB</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-bold uppercase">Orders Today</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">42 Sales</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-bold uppercase">Catalog Stocked</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">98.4%</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-bold uppercase">Low Stock Alert</p>
                    <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">2 Items</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase mb-2">
                    <span>Recent Checkout</span>
                    <span className="text-emerald-700">Stock Decremented Automatically</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200 text-sm">
                    <div>
                      <span className="font-bold text-slate-900">Abebe Kebede</span>
                      <span className="text-xs text-slate-500 block">Coca Cola 330ml (4) • Mineral Water 1L (2)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900">220.00 ETB</span>
                      <span className="text-xs text-slate-500 block font-medium">Paid via Telebirr</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Admin Audit Preview */}
            {activeTab === 'audit' && (
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-xl bg-amber-100 p-2 text-amber-700 mt-0.5">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                          Pending Admin Review
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Delete Intercepted</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        Employee Dawit requested permanent deletion of "Highland Mineral Water 1L".
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        The item remains safely active in the catalog. Only you as Administrator can authorize permanent removal.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-700 mt-0.5">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <span className="bg-blue-100 text-blue-900 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                        Price Audit Log
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        Employee Hana modified price of "Sunflower Oil 1L" from 250.00 ETB to 260.00 ETB.
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Logged on Today at 02:14 PM with staff ID #04.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Section */}
      <section className="py-20 border-t border-slate-200 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              Enterprise Control, Everyday Simplicity
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900">
              Engineered for complete retail oversight
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
              Equip your staff with fast point of sale while keeping ownership authority firmly in your hands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1 */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-6">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Atomic Point of Sale</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Ring up sales in Ethiopian Birr with instant stock verification. The system automatically rejects checkouts that exceed available inventory, eliminating inventory mismatch.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-bold mb-6">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Admin-Only Deletions</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Employees can record sales and add products, but cannot permanently delete any catalog or customer data. Any employee deletion attempt is routed to the Admin Center for your review.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-6">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Price Change Auditing</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Prevent rogue price modifications. Whenever staff updates a price, the system logs the employee name, old price, new price, and timestamp in your permanent audit history.
              </p>
            </div>

            {/* Bento Card 4 */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm hover:shadow-md transition md:col-span-2">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-6">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Automated Daily Revenue & Inventory Alerts</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                No more paper calculations at closing time. The visual dashboard calculates revenue in real time, plots daily sales trends, and highlights low-stock products before you run out.
              </p>
            </div>

            {/* Bento Card 5 */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Customer Ledgers</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Track phone numbers, delivery addresses, and cumulative lifetime purchase history for your repeat buyers in one centralized directory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Why Upgrade From Notebooks & Excel */}
      <section className="py-20 border-t border-slate-200 bg-slate-50 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Direct Comparison</h2>
            <h3 className="mt-2 text-3xl font-black text-slate-900">
              Why leading retail shops leave paper and spreadsheets behind
            </h3>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="p-4 sm:p-5">Capability</th>
                  <th className="p-4 sm:p-5 text-slate-500">Notebooks & Excel</th>
                  <th className="p-4 sm:p-5 text-emerald-700 font-black">Business Management System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">Live Stock Decrement</td>
                  <td className="p-4 sm:p-5 text-red-600 flex items-center">
                    <X className="h-4 w-4 mr-1.5 flex-shrink-0" /> Manual counting
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">
                    <span className="flex items-center"><Check className="h-4 w-4 mr-1.5 flex-shrink-0" /> Instant on every sale</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">Employee Theft & Accidental Delete</td>
                  <td className="p-4 sm:p-5 text-red-600 flex items-center">
                    <X className="h-4 w-4 mr-1.5 flex-shrink-0" /> Zero protection
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">
                    <span className="flex items-center"><Check className="h-4 w-4 mr-1.5 flex-shrink-0" /> Protected (Admin authorization only)</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">Price Override Auditing</td>
                  <td className="p-4 sm:p-5 text-red-600 flex items-center">
                    <X className="h-4 w-4 mr-1.5 flex-shrink-0" /> Untracked
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">
                    <span className="flex items-center"><Check className="h-4 w-4 mr-1.5 flex-shrink-0" /> Full audit history logged</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">Daily Revenue Calculation</td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    Hours spent with calculator
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">
                    <span className="flex items-center"><Check className="h-4 w-4 mr-1.5 flex-shrink-0" /> Real-time automatic dashboard</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3-Step Setup */}
      <section className="py-20 border-t border-slate-200 bg-white px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Simple Onboarding</h2>
          <h3 className="mt-2 text-3xl font-black text-slate-900">
            Up and running in 3 simple steps
          </h3>

          <div className="grid sm:grid-cols-3 gap-8 mt-12 text-left">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <span className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                1
              </span>
              <h4 className="font-bold text-slate-900 text-base">Register Your Store</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Provide your store name, address, and set up your master administrator account in seconds.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <span className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                2
              </span>
              <h4 className="font-bold text-slate-900 text-base">Add Inventory & Staff</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Enter your products with prices in ETB and invite hired employees with protected staff permissions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <span className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                3
              </span>
              <h4 className="font-bold text-slate-900 text-base">Sell with Confidence</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Ring up sales via cash or mobile payments (Telebirr/CBE). Stock and revenue update automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Light Banner */}
      <section className="py-20 border-t border-slate-200 bg-gradient-to-b from-slate-50 via-emerald-50/40 to-white text-slate-900 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 mb-6 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Ready for Immediate Deployment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ready to modernize your retail store?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Create your master administrator account in seconds. Manage inventory, ring up sales, and protect your store with full staff oversight.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.01] transition"
            >
              Register Your Business Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Light Footer */}
      <footer className="border-t border-slate-200 py-10 px-6 bg-white text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Store className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">
              Business Management System
            </span>
          </div>
          <div className="flex items-center space-x-6 text-xs font-semibold text-slate-600">
            <Link href="/register" className="hover:text-emerald-700 transition">Register</Link>
            <Link href="/login" className="hover:text-emerald-700 transition">Sign In</Link>
            <Link href="/admin" className="hover:text-emerald-700 transition">Admin Portal</Link>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 Retail Management System. Enterprise RBAC & POS Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
