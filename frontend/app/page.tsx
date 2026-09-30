'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  Package, 
  Users, 
  ShoppingCart,
  Laptop,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                Business Management System
              </span>
              <span className="text-xs text-emerald-400 font-medium">For Ethiopian Small Businesses</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition"
                >
                  Try Demo Store
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.25),rgba(255,255,255,0))]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-8 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Working Demo: Yoni Mini Market (Addis Ababa)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop Managing Your Business with <span className="text-emerald-400 underline decoration-emerald-500/40">Notebooks & Excel</span>.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Record sales, track inventory in real-time, maintain customer records, and monitor your daily revenue in Ethiopian Birr (ETB)—all in one unified, simple system.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] transition"
            >
              Explore Live Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-8 py-4 text-base font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Register Your Business
            </Link>
          </div>

          {/* Quick Demo Preview Card */}
          <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6 shadow-2xl backdrop-blur-xl max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-400 font-mono ml-2">Yoni Mini Market • Bole Medhanialem</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-md">
                  Active Demo Environment
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">45,500 ETB</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Completed Sales</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400 mt-1">128 Orders</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Active Products</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-400 mt-1">84 Items</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Low Stock Alert</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">3 Items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 border-t border-slate-800 bg-slate-900/50 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">The Problem</h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Why manual retail bookkeeping is holding you back
            </h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-6">
              <div className="h-10 w-10 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center font-bold mb-4">
                ✕
              </div>
              <h4 className="text-lg font-bold text-white">Lost Sales & Calculations</h4>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Receipts in paper notebooks get lost, damaged, or miscalculated during busy rush hours.
              </p>
            </div>

            <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-6">
              <div className="h-10 w-10 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center font-bold mb-4">
                ✕
              </div>
              <h4 className="text-lg font-bold text-white">Stock-outs & Surprises</h4>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Discovering you ran out of Coca Cola, oil, or sugar only after a customer asks to buy.
              </p>
            </div>

            <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-6">
              <div className="h-10 w-10 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center font-bold mb-4">
                ✕
              </div>
              <h4 className="text-lg font-bold text-white">Unknown Daily Profits</h4>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Hours spent every evening with a calculator trying to determine your real daily revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Section */}
      <section className="py-20 border-t border-slate-800 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Core Workflow</h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Automated in seconds
            </h3>
          </div>

          <div className="grid sm:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-white">1. Add Product</h4>
              <p className="mt-1 text-xs text-slate-400">Specify name, price in ETB, and starting inventory.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-white">2. Select Customer</h4>
              <p className="mt-1 text-xs text-slate-400">Link purchase to repeat customer or walk-in buyer.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-white">3. Record Sale</h4>
              <p className="mt-1 text-xs text-slate-400">Instant stock validation prevents negative stock.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-white">4. Auto-Update</h4>
              <p className="mt-1 text-xs text-slate-400">Stock decrements and revenue updates immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to experience Yoni Mini Market?
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Click below to instantly test the demo account. No setup required.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 transition"
            >
              Launch Live Demo Store
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Business Management System. Built for Ethiopian Retail Businesses.</p>
      </footer>
    </div>
  );
}
