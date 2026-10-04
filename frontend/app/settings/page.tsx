'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  User, 
  ShieldCheck, 
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  LogOut,
  Info,
  Lock,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { BusinessSettings, CurrencyInfo } from '@/types';

interface SettingsResponse {
  status: 'UPDATED' | 'PENDING_APPROVAL' | 'UNCHANGED' | string;
  message: string;
  settings?: BusinessSettings;
}

export default function SettingsPage() {
  const { user, loading: authLoading, logout, updateUserData } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Business Settings State (Admin only)
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [bizLoading, setBizLoading] = useState(false);
  const [bizSaving, setBizSaving] = useState(false);
  const [bizSuccess, setBizSuccess] = useState<string | null>(null);
  const [bizError, setBizError] = useState<string | null>(null);
  const [bizForm, setBizForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'ETB',
    currency_symbol: 'Br',
    payment_phone: '',
    payment_account_name: '',
    cbe_account: '',
    other_bank_info: '',
    payment_instructions: ''
  });

  // Personal Profile State (All users)
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const isAdmin = user?.role === 'admin';
  const isCoAdmin = user?.role === 'co_admin';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Populate personal profile form
      setProfileForm({
        name: user.name || '',
        username: user.username || user.email.split('@')[0],
        email: user.email || '',
        password: ''
      });

      // If Administrator, fetch Business Profile & Currencies
      if (user.role === 'admin') {
        const loadBizSettings = async () => {
          setBizLoading(true);
          try {
            const data = await apiRequest<BusinessSettings>('/settings');
            setCurrencies(data.available_currencies || []);
            setBizForm({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              currency: data.currency || 'ETB',
              currency_symbol: data.currency_symbol || 'Br',
              payment_phone: data.payment_phone || '',
              payment_account_name: data.payment_account_name || '',
              cbe_account: data.cbe_account || '',
              other_bank_info: data.other_bank_info || '',
              payment_instructions: data.payment_instructions || ''
            });
          } catch (err: any) {
            setBizError(err.message || 'Failed to load business settings.');
          } finally {
            setBizLoading(false);
          }
        };
        loadBizSettings();
      }
    }
  }, [user, authLoading, router]);

  // Handle Business Settings Save (Admin only)
  const handleBizSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizForm.name.trim()) {
      setBizError('Business Name is required.');
      return;
    }

    setBizSaving(true);
    setBizSuccess(null);
    setBizError(null);

    try {
      const res = await apiRequest<SettingsResponse>('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          name: bizForm.name.trim(),
          email: bizForm.email.trim() || null,
          phone: bizForm.phone.trim() || null,
          address: bizForm.address.trim() || null,
          currency: bizForm.currency,
          currency_symbol: bizForm.currency_symbol,
          payment_phone: bizForm.payment_phone.trim() || null,
          payment_account_name: bizForm.payment_account_name.trim() || null,
          cbe_account: bizForm.cbe_account.trim() || null,
          other_bank_info: bizForm.other_bank_info.trim() || null,
          payment_instructions: bizForm.payment_instructions.trim() || null
        })
      });

      setBizSuccess(res.message || 'Business profile and currency updated successfully.');
      if (res.settings) {
        updateUserData({
          business_name: res.settings.name,
          currency: res.settings.currency,
          currency_symbol: res.settings.currency_symbol
        });
      }
    } catch (err: any) {
      setBizError(err.message || 'Failed to update business settings.');
    } finally {
      setBizSaving(false);
    }
  };

  const handleCurrencyChange = (code: string) => {
    const selected = currencies.find(c => c.code === code);
    setBizForm(prev => ({
      ...prev,
      currency: code,
      currency_symbol: selected ? selected.symbol : 'Br'
    }));
  };

  // Handle Personal Profile Save (Admin: immediate, Staff/Co-admin: submits for Admin approval)
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileError('Full Name and Email Address are required.');
      return;
    }

    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileNotice(null);
    setProfileError(null);

    try {
      const bodyPayload: any = {
        name: profileForm.name.trim(),
        username: profileForm.username.trim() || undefined,
        email: profileForm.email.trim().toLowerCase(),
      };
      if (profileForm.password.trim()) {
        bodyPayload.password = profileForm.password.trim();
      }

      const res = await apiRequest<any>('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(bodyPayload)
      });

      if (res.status === 'PENDING_APPROVAL') {
        setProfileNotice(res.message);
      } else {
        setProfileSuccess(res.message || 'Profile updated successfully.');
        if (res.user) {
          updateUserData({
            name: res.user.name,
            username: res.user.username,
            email: res.user.email
          });
        }
      }
      setProfileForm(prev => ({ ...prev, password: '' }));
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (authLoading || (!user && (bizLoading || profileSaving))) {
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
          title="Account & Settings" 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isAdmin ? 'Store Settings & Profile' : 'Personal User Profile'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isAdmin 
                ? 'Manage store identity, default operating currency, and your administrator profile' 
                : 'View and manage your personal staff account details'
              }
            </p>
          </div>

          <div className="max-w-4xl space-y-6">

            {/* ========================================================================= */}
            {/* 1. BUSINESS PROFILE & CURRENCY: ONLY VISIBLE TO ADMINISTRATORS */}
            {/* ========================================================================= */}
            {isAdmin && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-800">Business Profile & Currency</h3>
                      <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[11px] font-bold">
                        Admin Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Retail store details and default transactions currency</p>
                  </div>
                </div>

                {bizSuccess && (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{bizSuccess}</span>
                  </div>
                )}

                {bizError && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-red-800 text-xs font-semibold">
                    {bizError}
                  </div>
                )}

                {bizLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : (
                  <form onSubmit={handleBizSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600">Business / Store Name *</label>
                        <input
                          type="text"
                          required
                          value={bizForm.name}
                          onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600">Default Currency *</label>
                        <select
                          value={bizForm.currency}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-emerald-700 bg-white focus:border-emerald-500 focus:outline-none"
                        >
                          {currencies.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} ({c.symbol}) — {c.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Active symbol: <strong className="text-slate-800">{bizForm.currency_symbol}</strong> (Used across POS, Daily Reports, & Catalog)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600">Store Contact Email</label>
                        <input
                          type="email"
                          placeholder="contact@store.et"
                          value={bizForm.email}
                          onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600">Store Contact Phone</label>
                        <input
                          type="text"
                          placeholder="+251 91 122 3344"
                          value={bizForm.phone}
                          onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600">Physical Store Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Bole Medhanialem, Edna Mall Area, Addis Ababa"
                        value={bizForm.address}
                        onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Online Orders & Payment Accounts Section */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center space-x-2.5 mb-3">
                        <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                            Online Orders & Payment Accounts (Telebirr & Banks)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            These accounts are shown to customers on your shared storefront link so they know where to transfer money before uploading receipts.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600">
                            Telebirr Merchant / Phone Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 0911 22 33 44"
                            value={bizForm.payment_phone}
                            onChange={(e) => setBizForm({ ...bizForm, payment_phone: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                          />
                          <p className="mt-1 text-[10px] text-slate-400">
                            Shown to customers selecting Telebirr or CBE Birr
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600">
                            Payment Account Recipient Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Abebe Store / Abebe Kebede"
                            value={bizForm.payment_account_name}
                            onChange={(e) => setBizForm({ ...bizForm, payment_account_name: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                          />
                          <p className="mt-1 text-[10px] text-slate-400">
                            Name displayed to customers to verify account holder
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600">
                            CBE (Commercial Bank of Ethiopia) Account #
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1000 1234 5678 9"
                            value={bizForm.cbe_account}
                            onChange={(e) => setBizForm({ ...bizForm, cbe_account: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                          />
                          <p className="mt-1 text-[10px] text-slate-400">
                            Shown for Bank Transfer & CBE Birr
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600">
                            Other Bank Information (Awash, Dashen, etc.)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Awash: 01320..., Dashen: 12345..."
                            value={bizForm.other_bank_info}
                            onChange={(e) => setBizForm({ ...bizForm, other_bank_info: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                          />
                          <p className="mt-1 text-[10px] text-slate-400">
                            Optional additional banks and account numbers
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-bold uppercase text-slate-600">
                          Payment Instructions for Customers
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Please transfer the exact order amount, then copy the transaction reference number and attach your screenshot receipt below."
                          value={bizForm.payment_instructions}
                          onChange={(e) => setBizForm({ ...bizForm, payment_instructions: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Updates apply immediately to all terminals
                      </span>

                      <button
                        type="submit"
                        disabled={bizSaving}
                        className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition"
                      >
                        {bizSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Business Settings
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. PERSONAL USER PROFILE (FOR ALL USERS) */}
            {/* For employees & co-admins: requires admin approval before verified */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {isAdmin ? 'Administrator Profile' : 'Your Staff Profile'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAdmin 
                      ? 'Your personal administrator account credentials' 
                      : 'Personal employee details (Edits require Administrator verification)'
                    }
                  </p>
                </div>
              </div>

              {/* Role Notice for Staff / Co-Admin */}
              {!isAdmin && (
                <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-amber-900 text-xs flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Profile Changes Require Admin Approval</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      You are logged in as <strong>{isCoAdmin ? 'a Co-Manager' : 'an Employee'}</strong>. Any modifications to your full name, username, email, or password will be submitted as an approval request to the <strong>Business Administrator</strong> and will be applied once verified.
                    </p>
                  </div>
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileNotice && (
                <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-blue-900 text-xs font-semibold flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>{profileNotice}</span>
                </div>
              )}

              {profileError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-red-800 text-xs font-semibold">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600">Username *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600">
                      New Password (Leave blank to keep unchanged)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={profileForm.password}
                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="text-slate-400 uppercase font-bold mr-2">Assigned Role:</span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isAdmin ? 'bg-purple-100 text-purple-800' : isCoAdmin ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isAdmin ? 'Business Administrator' : isCoAdmin ? 'Co-Manager' : 'Staff / Employee'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 px-3.5 py-2 text-xs font-bold transition"
                    >
                      <LogOut className="mr-1.5 h-3.5 w-3.5" />
                      Sign Out
                    </button>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition"
                    >
                      {profileSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {isAdmin ? 'Update Profile' : 'Submit for Admin Approval'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
