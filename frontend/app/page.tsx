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
  ShoppingBag,
  Sun,
  Moon,
  Globe
} from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/lib/language';
import { useTheme } from '@/lib/theme';

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
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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

  const storeName = storeData?.business.name || t('app_name', 'Retail & Business Management System');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-600 selection:text-white font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:bg-emerald-500 transition">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white block leading-tight">
                {storeName}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                {t('app_tagline', 'Point of Sale & Business Operations')}
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <a
              href="#features"
              className="hidden lg:inline-flex text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition px-2 py-1"
            >
              {t('nav_features', 'Key Features')}
            </a>

            <a
              href="#hierarchy"
              className="hidden lg:inline-flex text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition px-2 py-1"
            >
              {t('nav_hierarchy', 'Staff Roles')}
            </a>

            <a
              href="#reports"
              className="hidden lg:inline-flex text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition px-2 py-1"
            >
              {t('nav_reports', 'Daily Reports')}
            </a>

            {/* Language Switcher (🇬🇧 EN / 🇪🇹 አማ) */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              title={language === 'en' ? "Switch to Amharic (ወደ አማርኛ ቀይር)" : "Switch to English"}
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}</span>
            </button>

            {/* Theme Switcher (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>

            <Link
              href="/shop"
              className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('nav_shop_online', 'Shop Online')}</span>
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-slate-900 dark:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-emerald-500 transition"
              >
                {t('nav_dashboard', 'Dashboard')}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
                >
                  {t('nav_staff_portal', 'Staff Portal')}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
                >
                  {t('nav_register_store', 'Register Store')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 px-4 sm:px-6 bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-6 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('app_subtitle', 'Multi-Tier Staff Hierarchy • POS Terminal • Automated Daily Reconciliation')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            {language === 'am' ? (
              <>
                የተቀናጀ የችርቻሮ ንግድና <span className="text-emerald-600 dark:text-emerald-400">የስራ አመራር ሥርዓት</span>
              </>
            ) : (
              <>
                Unified Retail Operations & <span className="text-emerald-600 dark:text-emerald-400">Business Management</span>
              </>
            )}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {language === 'am'
              ? "ለመደብሮች፣ ሱፐርማርኬቶችና የንግድ ድርጅቶች የተዘጋጀ። ለገንዘብ ተቀባዮች ፈጣን የሽያጭ መመዝገቢያ፣ ያለቁ ዕቃዎችን ወዲያውኑ የማሳወቅ ሥርዓት፣ ለረዳት ስራ አስኪያጆች የስራ ውክልና፣ እና በቀን መጨረሻ አጠቃላይ የሽያጭና ክምችት ማጠቃለያ ሪፖርት ያቀርባል።"
              : "Designed for retail stores, supermarkets, and enterprise merchants. Empower cashiers with fast POS sales, maintain verified inventory with automatic zero-stock alerts, delegate operational tasks to co-managers, and review automated daily financial reconciliation."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.01] transition"
              >
                {t('nav_dashboard', 'Go to Store Dashboard')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.01] transition"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {t('auth_signin_title', 'Staff Portal Sign In')}
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
                >
                  <Building2 className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  {t('auth_register_title', 'Register New Store')}
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-5 py-3.5 text-sm font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs"
                >
                  <ShoppingBag className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {t('nav_shop_online', 'Order Online')}
                </Link>
              </>
            )}
          </div>

          {/* Quick Pillars Grid */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-emerald-600 dark:text-emerald-400 w-fit mb-3">
                <Receipt className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {language === 'am' ? 'የሽያጭ ተርሚናል (POS)' : 'Point of Sale (POS)'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'am' ? 'ፈጣን ሽያጭ፣ የባርኮድ ፍለጋና ደረሰኝ ማመንጫ' : 'Instant sales processing, barcode search & receipts'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 p-2.5 text-blue-600 dark:text-blue-400 w-fit mb-3">
                <BadgeAlert className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {language === 'am' ? 'ያለቁ ዕቃዎች ማስጠንቀቂያ' : 'Zero-Stock Alerts'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'am' ? 'ክምችት 0 ሲደርስ በቀጥታ "EMPTY" ተብሎ ይጠቆማል' : "Automatic 'EMPTY' status when items reach 0 stock"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="rounded-xl bg-purple-50 dark:bg-purple-950/60 p-2.5 text-purple-600 dark:text-purple-400 w-fit mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {language === 'am' ? 'የሰራተኞች እርከን' : 'Staff Hierarchy'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'am' ? 'የአስተዳዳሪ ቁጥጥር፣ የረዳት ስራ አስኪያጅ ውክልናና ገንዘብ ተቀባይ' : 'Admin oversight, Co-Manager delegation & Cashier roles'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 p-2.5 text-amber-600 dark:text-amber-400 w-fit mb-3">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {language === 'am' ? 'የቀን የሂሳብ ማጠቃለያ' : 'Daily Reconciliation'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'am' ? 'የቀን አጠቃላይ ገቢ፣ የተሸጡ ዕቃዎችና ቀሪ ክምችት' : 'End-of-day revenue, sold quantity & remaining stock'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: SYSTEM CAPABILITIES & FEATURES */}
      <section id="features" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            {language === 'am' ? 'መሰረታዊ አወቃቀር' : 'Core Architecture'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'am' ? 'ለትክክለኛነትና ተጠያቂነት የተገነባ' : 'Engineered for Precision & Accountability'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            {language === 'am' 
              ? 'እያንዳንዱ ሽያጭ፣ የዋጋ ለውጥ እና የክምችት ዝውውር በሰራተኞች እርከን ቁጥጥር ይደረግበታል' 
              : 'Every transaction, price update, and stock movement is verified and audited across your business hierarchy.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold mb-4">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የገንዘብ ተቀባይ መመዝገቢያ (POS)' : 'Point of Sale Cashier Terminal'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {language === 'am'
                ? 'ፈጣን የሽያጭ መስኮት፣ በምርት ስም ወይም ባርኮድ መፈለጊያ፣ የደንበኛ ታማኝነት መለያና ደረሰኝ ማተሚያ።'
                : 'Fast, intuitive cashier sales screen with instant search, quantity adjustment, customer loyalty attachment, and receipt generation.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition">
            <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold mb-4">
              <Package className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የተረጋገጠ ካታሎግና የክምችት ቁጥጥር' : 'Verified Catalog & Stock Control'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {language === 'am'
                ? 'የምርት ምድቦች፣ የትርፍ መጠን ክትትልና አውቶማቲክ ምልክት፦ ክምችቱ 0 ሲሆን ወዲያውኑ EMPTY ተብሎ ምልክት ይሰጣል።'
                : 'Structured category organization, cost-to-retail profit margin tracking, and automated inventory labeling: items with 0 stock are immediately marked EMPTY.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition">
            <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold mb-4">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የአመራር ውክልናና ማረጋገጫዎች' : 'Managerial Delegation & Approvals'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {language === 'am'
                ? 'ረዳት ስራ አስኪያጆች ምርት ማከልና ሽያጭ ማስተዳደር ይችላሉ። የተደረጉ ለውጦች ወዲያውኑ ለዋናው ባለቤት ይደርሳሉ።'
                : 'Co-Managers can add products and manage operational flow. All co-manager modifications automatically trigger alerts for the Store Owner.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition">
            <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የቀን አውቶማቲክ የሂሳብ ማጠቃለያ' : 'Automated Daily Reconciliation'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {language === 'am'
                ? 'በዳሽቦርድ ላይ የቀን አጠቃላይ ገቢ፣ የተሸጡ ዕቃዎች ብዛት፣ ቀሪ ክምችትና የክፍያ ዘዴዎች በዝርዝር ይሰላሉ።'
                : 'Comprehensive daily reports accessible on the admin dashboard calculating total sales revenue, units sold, remaining stock count, and payment method breakdowns.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition">
            <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የኦዲት መዝገብና የማሳወቂያ ደወል' : 'Audit Logs & Notification Bell'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {language === 'am'
                ? 'የማሳወቂያ ማዕከል ባለቤቱን በቅጽበት ያሳውቃል። የረዳት ስራ አስኪያጆችን እንቅስቃሴዎች ማጣራትና መዝገቦችን ማስተዳደር ይቻላል።'
                : 'The admin header notification center keeps store owners in full sync. Filter notifications by Co-Manager activity, view detailed audit logs, and clear logs when needed.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition">
            <div className="h-11 w-11 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold mb-4">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የገንዘብ አይነቶችና የመደብር ማስተካከያ' : 'Multi-Currency & Business Settings'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {language === 'am'
                ? 'የኢትዮጵያ ብር (ETB) ወይም አለምአቀፍ የገንዘብ አይነቶች (USD, EUR, GBP) ማዋቀር፣ የመደብር አድራሻና የክፍያ አካውንቶች ማስተካከያ።'
                : 'Admin-exclusive business profile controls. Configure Ethiopian Birr (ETB) by default or select from international currencies (USD, EUR, GBP), and store contact info.'}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: 3-TIER ROLE HIERARCHY */}
      <section id="hierarchy" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 px-4 sm:px-6 transition-colors">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              {language === 'am' ? 'የሰራተኞች ሚናና ስልጣን' : 'Staff Roles & Permissions'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {language === 'am' ? 'ለመደብር ቡድኖች የተመጣጠነ አስተዳደር' : 'Balanced Governance for Store Teams'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              {language === 'am'
                ? 'እያንዳንዱ የሰራተኛ አባል ግልጽ ኃላፊነትና የአሰራር ማረጋገጫ ባለው የተለየ ሚና ይሰራል'
                : 'Every staff member operates inside an optimized role with explicit responsibilities and verification safety nets.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Card */}
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-[11px] font-black uppercase">
                    {language === 'am' ? 'ከፍተኛ ስልጣን' : 'Highest Authority'}
                  </span>
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('auth_role_admin', 'Store Administrator')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {language === 'am' ? 'የመደብሩ ባለቤትና ዋና ስራ አስኪያጅ' : 'Store Owner & Executive Manager'}
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'ሙሉ የመደብር መረጃና የገንዘብ አይነት ምርጫ' : 'Full business profile & multi-currency selection'}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'የቀጥታ የማሳወቂያ ደወል ለረዳት ስራ አስኪያጅ ተግባራት' : 'Real-time notification bell for co-manager actions'}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'የእንቅስቃሴ ኦዲት መዝገብና የሪፖርት ቁጥጥር' : 'Activity audit logs with report deletion capability'}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'የቀን መጨረሻ የፋይናንስና የሽያጭ ማጠቃለያ ሪፖርቶች' : 'End-of-day financial reconciliation reports'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-200/70 dark:border-emerald-800">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">
                  {language === 'am' ? 'መዳረሻ፦ ሙሉ የመደብር ዳሽቦርድና የአስተዳዳሪ ማዕከል' : 'Access: Full Store Dashboard & Admin Console'}
                </span>
              </div>
            </div>

            {/* Co-Manager Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 px-2.5 py-0.5 text-[11px] font-black uppercase">
                    {language === 'am' ? 'የስራ አመራር መሪ' : 'Operational Lead'}
                  </span>
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('auth_role_coadmin', 'Co-Manager')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {language === 'am' ? 'የፈረቃ ተቆጣጣሪና ረዳት ስራ አስኪያጅ' : 'Floor Supervisor & Shift Manager'}
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'ምርቶች ማከል፣ ዋጋ መወሰንና ደንበኞችን መመዝገብ' : 'Add products, set pricing & register customers directly'}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'የተደረጉ ስራዎች በሙሉ ለዋና አስተዳዳሪው በቀጥታ ይደርሳሉ' : 'All actions logged & notified to admin automatically'}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'የገንዘብ ተቀባይ ሰራተኞችን ጥያቄዎች ማጽደቅ' : 'Can approve cashier/employee catalog modifications'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-blue-700 dark:text-blue-400 font-bold block">
                  {language === 'am' ? 'መዳረሻ፦ ካታሎግ፣ ሽያጭ፣ ይሁንታዎችና የግል መረጃ' : 'Access: Catalog, Sales, Approvals & Personal Profile'}
                </span>
              </div>
            </div>

            {/* Cashier / Employee Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 text-[11px] font-black uppercase">
                    {language === 'am' ? 'የፊት መስመር ሰራተኛ' : 'Frontline Staff'}
                  </span>
                  <Receipt className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('auth_role_cashier', 'Employee / Cashier')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {language === 'am' ? 'የሽያጭ አፈጻጸምና የደንበኞች አገልግሎት' : 'POS Sales Execution & Customer Service'}
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-slate-600 dark:text-slate-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'ፈጣን የሽያጭ ተርሚናል ስራዎችን ማከናወን' : 'High-speed POS sales terminal operation'}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-slate-600 dark:text-slate-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'በሽያጭ ወቅት ደንበኛ መፈለግና አዲስ መመዝገብ' : 'Customer lookup and registration at checkout'}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-slate-600 dark:text-slate-400 mr-2 shrink-0 mt-0.5" />
                    <span>{language === 'am' ? 'የዋጋና ምርት ለውጦች ይሁንታ በመጠባበቅ ላይ ይቀመጣሉ' : 'Product and price change requests held for approval'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold block">
                  {language === 'am' ? 'መዳረሻ፦ የሽያጭ ጣቢያ፣ ደንበኞችና የስራ ገጽ' : 'Access: POS Station, Customer Roster & Assigned Workspace'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: DAILY RECONCILIATION HIGHLIGHT */}
      <section id="reports" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
          <div className="max-w-3xl">
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider inline-block mb-3">
              {language === 'am' ? 'አውቶማቲክ የፋይናንስ መረጃ' : 'Automated Financial Intelligence'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {language === 'am' ? 'የቀን ስራዎችና የሽያጭ ማጠቃለያ (Reconciliation)' : 'Daily Operations & Sales Reconciliation'}
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              {language === 'am'
                ? 'በየቀኑ መደብሩ ሲዘጋ፣ አስተዳዳሪዎችና ስራ አስኪያጆች ያለ ምንም በእጅ ስሌት ስህተት ትክክለኛ መረጃ ያገኛሉ፦'
                : 'Every day at closing, administrators and managers get clear, actionable numbers without manual tallying or spreadsheet errors:'}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                {language === 'am' ? 'የቀን አጠቃላይ ሽያጭ' : 'Gross Daily Sales'}
              </span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {language === 'am' ? 'ትክክለኛ ገቢ' : 'Exact Revenue'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'am' ? 'ከተረጋገጡ የሽያጭ ትዕዛዞች ይሰላል' : 'Calculated from verified POS orders'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                {language === 'am' ? 'የሽያጭ መጠን' : 'Sales Volume'}
              </span>
              <p className="text-xl font-black text-white mt-1">
                {language === 'am' ? 'የተሸጡ ዕቃዎች' : 'Units Sold'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'am' ? 'በምርት ምድብ ተቀንሶ ይሰላል' : 'Quantities deducted per product category'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                {language === 'am' ? 'የክምችት ሁኔታ' : 'Inventory Status'}
              </span>
              <p className="text-xl font-black text-amber-400 mt-1">
                {language === 'am' ? 'ቀሪ ክምችት' : 'Remaining Stock'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'am' ? 'ያለቁ ዕቃዎችን ወዲያው ያሳውቃል' : 'Automated alert on empty items'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                {language === 'am' ? 'የክፍያ ዝርዝር' : 'Payment Breakdown'}
              </span>
              <p className="text-xl font-black text-blue-400 mt-1">
                {language === 'am' ? 'ጥሬ / ቴሌብር / ሲቢኢ' : 'Cash / Card / Mobile'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'am' ? 'በክፍያ ዘዴ ተለይቶ የቀረበ' : 'Reconciliation by payment method'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 transition-colors">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'am' ? 'የችርቻሮ መደብርዎን ለማስተዳደር ዝግጁ ነዎት?' : 'Ready to Manage Your Retail Store?'}
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            {language === 'am'
              ? 'የሽያጭ መመዝገቢያ፣ ካታሎግ፣ ይሁንታዎችና የፋይናንስ ሪፖርቶችን ለማግኘት በተጠቃሚ ስምዎ ይግቡ።'
              : 'Sign in with your staff username to access the register, catalog manager, approval requests, and financial reports.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
            >
              {t('auth_signin_title', 'Sign In to Staff Portal')}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>

            {!user && (
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
              >
                {t('auth_register_title', 'Register Business Account')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white border-t border-slate-800 py-12 px-4 sm:px-6 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white block text-sm">{storeName}</span>
              <span>{t('app_tagline', 'Retail ERP, POS & Business Operations Platform')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-white transition">{t('nav_features', 'Features')}</a>
            <a href="#hierarchy" className="hover:text-white transition">{t('nav_hierarchy', 'Staff Hierarchy')}</a>
            <a href="#reports" className="hover:text-white transition">{t('nav_reports', 'Daily Reports')}</a>
            <Link href="/shop" className="hover:text-white transition text-emerald-400 font-bold">{t('nav_shop_online', 'Online Store')}</Link>
            <Link href="/login" className="hover:text-white transition">{t('nav_staff_portal', 'Staff Sign In')}</Link>
            <Link href="/register" className="hover:text-white transition">{t('nav_register_store', 'Register Store')}</Link>
          </div>

          <div>
            <span>© {new Date().getFullYear()} {storeName}. {t('all_rights_reserved', 'All rights reserved.')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
