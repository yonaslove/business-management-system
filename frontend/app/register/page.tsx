'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Store, ArrowRight, AlertCircle, Loader2, Check, X, ShieldAlert, ShieldCheck, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { useTheme } from '@/lib/theme';

const COMMON_CURRENCIES = [
  { code: 'ETB', name: 'Ethiopian Birr (Default)', symbol: 'Br' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    username: '',
    email: '',
    password: '',
    currency: 'ETB',
    currency_symbol: 'Br',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength checks
  const passwordCriteria = useMemo(() => {
    const p = formData.password;
    return {
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /\d/.test(p),
      symbol: /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\~`]/.test(p),
    };
  }, [formData.password]);

  const score = Object.values(passwordCriteria).filter(Boolean).length;
  const isPasswordStrong = score === 5;

  const handleCurrencyChange = (code: string) => {
    const selected = COMMON_CURRENCIES.find((c) => c.code === code);
    setFormData({
      ...formData,
      currency: code,
      currency_symbol: selected?.symbol || 'Br',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.owner_name || !formData.username || !formData.email || !formData.password) {
      setError(language === 'am' ? 'እባክዎ አስፈላጊ የሆኑትን ክፍት ቦታዎች በሙሉ ይሙሉ' : 'Please fill in all required fields.');
      return;
    }

    if (!isPasswordStrong) {
      setError(language === 'am' ? 'እባክዎ ጠንካራ የይለፍ ቃል መስፈርቶችን ያሟሉ' : 'Please meet all strong password requirements before registering.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || (language === 'am' ? 'ምዝገባው አልተሳካም። እባክዎ መረጃዎን ይፈትሹ።' : 'Registration failed. Please check details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Top right language and theme controls */}
      <div className="absolute top-6 right-6 flex items-center space-x-2">
        <button
          onClick={toggleLanguage}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
        >
          <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link href="/" className="inline-flex items-center space-x-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Store className="h-7 w-7" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('app_name', 'Business Management System')}
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {t('auth_register_title', 'Register your business')}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('auth_register_subtitle', 'Create an administrator account with secure role and currency setup')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 py-8 px-6 sm:px-10 shadow-lg rounded-3xl transition-colors">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 p-3.5 flex items-start space-x-3 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('auth_business_name', 'Business Name')} *
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder={language === 'am' ? "ለምሳሌ፦ መርካቶ ግሮሰሪ እና ሱፐርማርኬት" : "e.g. Merkato Grocery & Retail"}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('auth_owner_name', 'Owner / Manager Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  placeholder={language === 'am' ? "ለምሳሌ፦ ዮናስ ደሚሴ" : "e.g. Yonas Demisse"}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('auth_username', 'Username')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="e.g. yonas_admin"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('auth_email', 'Email Address')} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="owner@yourstore.et"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('auth_currency', 'Default Store Currency')} *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 font-medium cursor-pointer"
                >
                  {COMMON_CURRENCIES.map((cur) => (
                    <option key={cur.code} value={cur.code}>
                      {cur.code} — {cur.name} ({cur.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password Field with Strong Password Indicator */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('auth_password', 'Strong Password')} *
                </label>
                <span className={`text-xs font-bold ${
                  score <= 2 ? 'text-red-500' : score < 5 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {score === 0 ? '' : score <= 2 ? (language === 'am' ? 'ደካማ' : 'Weak') : score < 5 ? (language === 'am' ? 'ጥሩ' : 'Good') : (language === 'am' ? 'ጠንካራ የይለፍ ቃል ✓' : 'Strong Password ✓')}
                </span>
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={language === 'am' ? "A-Z, a-z, 0-9 እና ልዩ ምልክት ያካተተ መሆን አለበት" : "Must include A-Z, a-z, 0-9, and symbol"}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />

              {/* Strength Meter Bar */}
              <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    score <= 2 ? 'bg-red-500' : score < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(score / 5) * 100}%` }}
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center space-x-1.5 ${passwordCriteria.length ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {passwordCriteria.length ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                  <span>{language === 'am' ? 'ቢያንስ 8 ፊደላት' : 'At least 8 characters'}</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordCriteria.uppercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {passwordCriteria.uppercase ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                  <span>{language === 'am' ? 'ትልቅ የእንግሊዝኛ ፊደል (A-Z)' : 'Uppercase letter (A-Z)'}</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordCriteria.lowercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {passwordCriteria.lowercase ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                  <span>{language === 'am' ? 'ትንሽ የእንግሊዝኛ ፊደል (a-z)' : 'Lowercase letter (a-z)'}</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordCriteria.number ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {passwordCriteria.number ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                  <span>{language === 'am' ? 'ቁጥር (0-9)' : 'Number (0-9)'}</span>
                </div>
                <div className={`col-span-2 flex items-center space-x-1.5 ${passwordCriteria.symbol ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {passwordCriteria.symbol ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                  <span>{language === 'am' ? 'ልዩ ምልክት (!@#$%^&*...)' : 'Special symbol (!@#$%^&*...)'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('auth_phone', 'Phone Number')}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0911223344"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('auth_address', 'Shop Address / Location')}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={language === 'am' ? "ለምሳሌ፦ ቦሌ መድኃኔዓለም፣ አዲስ አበባ" : "e.g. Bole Medhanialem, Addis Ababa"}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {t('auth_create_admin', 'Create Administrator Account')}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-5">
            {t('auth_already_registered', 'Already registered?')}{' '}
            <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              {t('btn_sign_in', 'Sign in with username')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
