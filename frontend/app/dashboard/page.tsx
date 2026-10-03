'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { SalesChart } from '@/components/SalesChart';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { 
  DashboardSummary, 
  SalesChartPoint, 
  DashboardRecentSale, 
  DashboardLowStockProduct 
} from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<SalesChartPoint[]>([]);
  const [recentSales, setRecentSales] = useState<DashboardRecentSale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<DashboardLowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, chartRes, salesRes, stockRes] = await Promise.all([
        apiRequest<DashboardSummary>('/dashboard/summary'),
        apiRequest<SalesChartPoint[]>('/dashboard/sales?days=7'),
        apiRequest<DashboardRecentSale[]>('/dashboard/recent-sales?limit=6'),
        apiRequest<DashboardLowStockProduct[]>('/dashboard/low-stock?limit=6'),
      ]);

      setSummary(sumRes);
      setChartData(chartRes);
      setRecentSales(salesRes);
      setLowStockProducts(stockRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
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
      fetchData();
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title="Business Dashboard" 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {user?.business_name || 'Yoni Mini Market'}
              </h2>
              <p className="text-sm text-slate-500">
                Live Retail Overview • Currency: Ethiopian Birr (ETB)
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <Link
                href="/sales"
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                New Sale (POS)
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Product
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchData} className="underline font-semibold ml-4">Retry</button>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Total Revenue"
              value={`${(summary?.total_revenue || 0).toLocaleString()} ETB`}
              subtitle="All-time recorded revenue"
              icon={TrendingUp}
              variant="emerald"
            />
            <StatCard
              title="Total Sales"
              value={summary?.total_sales || 0}
              subtitle="Completed transactions"
              icon={ShoppingCart}
              variant="blue"
            />
            <StatCard
              title="Inventory Products"
              value={summary?.total_products || 0}
              subtitle="Catalog items tracked"
              icon={Package}
              variant="purple"
            />
            <StatCard
              title="Low Stock Items"
              value={summary?.low_stock_count || 0}
              subtitle={summary?.low_stock_count ? 'Action recommended' : 'Inventory healthy'}
              icon={AlertTriangle}
              variant={summary?.low_stock_count ? 'amber' : 'emerald'}
            />
          </div>

          {/* Sales Chart */}
          <div className="mb-8">
            <SalesChart data={chartData} />
          </div>

          {/* Bottom Grid: Recent Sales & Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Sales Table */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Recent Transactions</h3>
                  <p className="text-xs text-slate-500">Latest completed sales</p>
                </div>
                <Link
                  href="/sales"
                  className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  View all
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>

              {recentSales.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No sales recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3">Payment</th>
                        <th className="pb-3 text-right">Amount (ETB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 font-medium text-slate-800">
                            {sale.customer_name}
                          </td>
                          <td className="py-3 text-slate-500">
                            {sale.item_count} items
                          </td>
                          <td className="py-3">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {sale.payment_method}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-slate-900">
                            {sale.total_amount.toLocaleString()} ETB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Stock Alerts</h3>
                  <p className="text-xs text-slate-500">Products near or below reorder threshold</p>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Manage inventory
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="text-center py-10 text-emerald-600 text-sm font-medium">
                  ✓ All products are comfortably stocked!
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/50 p-3.5"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{prod.name}</h4>
                        <p className="text-xs text-slate-500">
                          {prod.category_name || 'Uncategorized'} • Price: {prod.price.toFixed(2)} {user?.currency_symbol || 'Br'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            prod.stock_quantity <= 0
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {prod.stock_quantity <= 0 ? 'EMPTY' : `ONLY ${prod.stock_quantity} LEFT`}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">Threshold: {prod.low_stock_threshold}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
