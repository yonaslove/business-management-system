'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Store, ArrowRight, AlertCircle, Loader2, CheckCircle2, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { useTheme } from '@/lib/theme';

function LoginContent() {
  const { login } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const isJustRegistered = searchParams.get('registered') === 'true';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(language === 'am' ? 'እባክዎ የተጠቃሚ ስምዎንና የይለፍ ቃልዎን ያስገቡ።' : 'Please provide both your username and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || (language === 'am' ? 'መግባት አልተሳካም። እባክዎ መረጃዎን ያረጋግጡ።' : 'Failed to sign in. Please verify your credentials.'));
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Store className="h-7 w-7" />
          </div>
        </Link>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {t('auth_signin_title', 'Sign in to your business account')}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('auth_signin_subtitle', 'Enter your username or email credentials to access the store')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 py-8 px-6 sm:px-10 shadow-lg rounded-3xl transition-colors">
          {/* Registration Success Banner */}
          {isJustRegistered && (
            <div className="mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 flex items-start space-x-3 text-emerald-900 dark:text-emerald-200 animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">
                  {language === 'am' ? 'ምዝገባው በተሳካ ሁኔታ ተጠናቋል!' : 'Registration Successful!'}
                </p>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-300 mt-0.5 leading-relaxed">
                  {language === 'am' 
                    ? 'የድርጅትዎና የአስተዳዳሪ አካውንትዎ ተፈጥሯል። ወደ ሲስተሙ ለመግባት መለያዎን ይጠቀሙ።' 
                    : 'Your business and administrator account have been created. Please sign in with your credentials to access the system.'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 p-3.5 flex items-start space-x-3 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('auth_username_email', 'Username or Email')}
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'am' ? "ለምሳሌ፦ yonas_owner ወይም user@store.et" : "e.g. abebe_owner or user@store.et"}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('auth_password', 'Password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {t('btn_sign_in', 'Sign In')}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('auth_need_account', 'Need to register a new store?')}{' '}
              <Link href="/register" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                {t('auth_create_admin', 'Create an Administrator Account')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
