'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Store, 
  User, 
  ShieldCheck, 
  DollarSign, 
  Database, 
  Server,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<string>('Checking...');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const checkHealth = async () => {
      try {
        const res = await apiRequest<any>('/health', { headers: {} });
        setBackendHealth(res.status === 'healthy' ? 'Online & Connected' : 'Degraded');
      } catch (e) {
        setBackendHealth('Offline (FastAPI server unreachable)');
      }
    };
    checkHealth();
  }, [user, authLoading, router]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title="Business Settings" 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Settings & Business Profile
            </h2>
            <p className="text-sm text-slate-500">
              Manage shop configurations and system environment
            </p>
          </div>

          <div className="max-w-4xl space-y-6">
            {/* Business Profile Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Business Profile</h3>
                  <p className="text-xs text-slate-500">Primary retail entity details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Business Name</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{user?.business_name || 'Yoni Mini Market'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Default Currency</span>
                  <p className="text-sm font-bold text-emerald-600 mt-1">ETB — Ethiopian Birr</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Location / Market</span>
                  <p className="text-sm text-slate-700 mt-1">Bole Medhanialem, Addis Ababa, Ethiopia</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Access Role</span>
                  <p className="text-sm font-bold text-slate-800 mt-1 flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" />
                    {user?.role === 'admin' ? 'Business Administrator' : 'Staff / Employee'}
                  </p>
                </div>
              </div>
            </div>

            {/* User Account Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">User Profile</h3>
                  <p className="text-xs text-slate-500">Currently authenticated account</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Full Name</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{user?.name}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Email Address</span>
                  <p className="text-sm text-slate-700 mt-1 font-mono text-xs">{user?.email}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={logout}
                  className="inline-flex items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 text-xs font-bold transition"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* System Status Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">System & Database Status</h3>
                  <p className="text-xs text-slate-500">Environment and API connectivity</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Backend API</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{backendHealth}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Database Engine</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">SQLite / PostgreSQL</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Architecture</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">Next.js + FastAPI</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
