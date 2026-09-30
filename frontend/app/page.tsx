'use client';

import React from 'react';
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
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block">
                Business Management System
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Retail & Inventory ERP • ETB</span>
            </div>
          </div>

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
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
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
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-8 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Built for Ethiopian Mini Markets, Retailers & Wholesalers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Smart Retail Management for Your <span className="text-emerald-600">Business Growth</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Record sales instantly, track inventory in real-time, maintain customer ledgers in Ethiopian Birr (ETB), and protect your shop with employee activity tracking and admin approval controls.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.01] transition"
            >
              Get Started — Register Shop
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Sign In to Your Account
            </Link>
          </div>

          {/* Clean Light System Preview Card */}
          <div className="mt-16 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl max-w-4xl mx-auto text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-slate-700 ml-2">Live Store Overview • Currency: ETB</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Protected by Admin RBAC
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                <p className="text-xs text-slate-500 uppercase font-semibold">Total Revenue</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">45,500 ETB</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                <p className="text-xs text-slate-500 uppercase font-semibold">Completed Sales</p>
                <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">128 Orders</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                <p className="text-xs text-slate-500 uppercase font-semibold">Active Products</p>
                <p className="text-xl sm:text-2xl font-black text-purple-600 mt-1">84 Items</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                <p className="text-xs text-slate-500 uppercase font-semibold">Low Stock Alert</p>
                <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">2 Items</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Control & Employee Role Highlight */}
      <section className="py-20 border-t border-slate-200/80 bg-white px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Staff & Employee Controls
            </span>
            <h3 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Never worry about unauthorized deletions or rogue price changes
            </h3>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
              Empower employees to sell while giving shop owners full oversight and authorization authority.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Admin-Only Permanent Deletions</h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Employees cannot permanently delete products or customers. When an employee requests a deletion, it is reported to the administrator for review.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Price Change Auditing</h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                If an employee alters an item's price, the system instantly logs who made the change, the old price, the new price, and the exact timestamp.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Full Audit Log & Approvals</h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                The business owner has a dedicated Admin Center to inspect staff activities, approve legitimate deletion requests, or dismiss unauthorized actions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Section */}
      <section className="py-20 border-t border-slate-200/80 bg-slate-50 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Automated Daily Workflow</h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything in sync automatically
            </h3>
          </div>

          <div className="grid sm:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900">1. Manage Catalog</h4>
              <p className="mt-1 text-xs text-slate-500">Track unit prices in ETB, stock quantities, and alert levels.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900">2. Customer Accounts</h4>
              <p className="mt-1 text-xs text-slate-500">Track phone numbers, delivery locations, and lifetime purchase totals.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900">3. Point of Sale</h4>
              <p className="mt-1 text-xs text-slate-500">Atomic transactions prevent overselling unavailable stock.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900">4. Live Ledgers</h4>
              <p className="mt-1 text-xs text-slate-500">Inventory decrements instantly and daily revenue updates in real time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-200/80 bg-white px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Start Managing Your Shop with Confidence
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Register your business today and get full inventory tracking, POS checkout, and staff management controls.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 transition"
            >
              Register Your Business
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500 bg-slate-50">
        <p>© 2026 Business Management System. Built for Ethiopian Retail Businesses.</p>
      </footer>
    </div>
  );
}
