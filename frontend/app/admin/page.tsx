'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  Loader2, 
  DollarSign, 
  ArrowRight,
  Filter,
  Calendar,
  Printer,
  RefreshCw,
  TrendingUp,
  Package,
  CreditCard,
  AlertOctagon,
  UserCheck,
  Store,
  Layers,
  FileText,
  Sparkles,
  Bell,
  Copy,
  ExternalLink,
  ShoppingBag,
  Check
} from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { apiRequest } from '@/lib/api';
import { Employee, ActivityLog, DailyReport } from '@/types';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tabs: 'daily_report' | 'activities' | 'employees'
  const [activeTab, setActiveTab] = useState<'daily_report' | 'activities' | 'employees'>('daily_report');

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
  );
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Shareable Online Storefront Link State
  const [copiedLink, setCopiedLink] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const shareableStoreLink = user?.business_id 
    ? `${origin || 'http://localhost:3000'}/shop?store=${user.business_id}`
    : `${origin || 'http://localhost:3000'}/shop`;

  const handleCopyStoreLink = () => {
    if (!shareableStoreLink) return;
    navigator.clipboard.writeText(shareableStoreLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };


  // Hire Employee Modal
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [hireForm, setHireForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [hireError, setHireError] = useState<string | null>(null);

  // Approval action loading
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Password strength checker helper
  const checkPasswordStrength = (pass: string) => {
    return {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      digit: /[0-9]/.test(pass),
      symbol: /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\~`]/.test(pass),
    };
  };

  const passCriteria = checkPasswordStrength(hireForm.password);
  const passScore = Object.values(passCriteria).filter(Boolean).length;
  const isPasswordStrong = passScore === 5;

  const loadBaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const actUrl = statusFilter ? `/admin/activities?status_filter=${statusFilter}` : '/admin/activities';
      const [empRes, actRes] = await Promise.all([
        apiRequest<Employee[]>('/admin/employees'),
        apiRequest<ActivityLog[]>(actUrl),
      ]);
      setEmployees(empRes);
      setActivities(actRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReport = async (dateStr: string) => {
    setReportLoading(true);
    try {
      const report = await apiRequest<DailyReport>(`/admin/daily-report?date=${dateStr}`);
      setDailyReport(report);
    } catch (err: any) {
      console.error('Failed to load daily report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'admin' && user.role !== 'co_admin') {
        router.push('/dashboard');
        return;
      }
      loadBaseData();
      loadDailyReport(selectedDate);
    }
  }, [user, authLoading, router, statusFilter]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    loadDailyReport(newDate);
  };

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const dateStr = d.toLocaleDateString('en-CA');
    setSelectedDate(dateStr);
    loadDailyReport(dateStr);
  };

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.name.trim() || !hireForm.email.trim() || !hireForm.password) {
      setHireError('Please fill in all required fields.');
      return;
    }

    if (!isPasswordStrong) {
      setHireError('Password does not meet strong security requirements. Must contain 8+ characters, uppercase, lowercase, number, and symbol.');
      return;
    }

    setHireSubmitting(true);
    setHireError(null);
    try {
      await apiRequest('/admin/employees', {
        method: 'POST',
        body: JSON.stringify({
          name: hireForm.name.trim(),
          username: hireForm.username.trim() || hireForm.email.split('@')[0].toLowerCase(),
          email: hireForm.email.trim().toLowerCase(),
          password: hireForm.password,
          role: hireForm.role,
        }),
      });
      setIsHireModalOpen(false);
      setHireForm({ name: '', username: '', email: '', password: '', role: 'employee' });
      loadBaseData();
    } catch (err: any) {
      setHireError(err.message || 'Failed to hire staff member.');
    } finally {
      setHireSubmitting(false);
    }
  };

  const handleRemoveEmployee = async (empId: number, empName: string) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can remove staff members.');
      return;
    }
    if (!confirm(`Are you sure you want to remove staff member "${empName}"? This action cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/employees/${empId}`, {
        method: 'DELETE',
      });
      loadBaseData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove employee.');
    }
  };

  const handleApproveActivity = async (id: number) => {
    if (user?.role !== 'admin' && user?.role !== 'co_admin') {
      alert('Only administrators or co-managers can authorize requests.');
      return;
    }
    setActionLoadingId(id);
    try {
      await apiRequest(`/admin/activities/${id}/approve`, {
        method: 'POST',
      });
      await Promise.all([loadBaseData(), loadDailyReport(selectedDate)]);
    } catch (err: any) {
      alert(err.message || 'Failed to approve activity.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissActivity = async (id: number) => {
    if (user?.role !== 'admin' && user?.role !== 'co_admin') {
      alert('Only administrators or co-managers can dismiss requests.');
      return;
    }
    setActionLoadingId(id);
    try {
      await apiRequest(`/admin/activities/${id}/dismiss`, {
        method: 'POST',
      });
      loadBaseData();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss activity.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can permanently delete activity reports.');
      return;
    }
    if (!confirm('Are you sure you want to permanently delete this activity report? This cannot be undone.')) return;
    setActionLoadingId(id);
    try {
      await apiRequest(`/admin/activities/${id}`, {
        method: 'DELETE',
      });
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete activity report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isCoAdmin = user?.role === 'co_admin';
  const pendingRequestsCount = activities.filter((a) => a.status === 'PENDING_APPROVAL').length;
  const currencySymbol = dailyReport?.summary.currency_symbol || user?.currency_symbol || 'Br';
  const currencyCode = dailyReport?.summary.currency || user?.currency || 'ETB';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={t('nav_admin', 'Admin & Daily Reports')} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Role Notice for Co-Managers */}
          {isCoAdmin && (
            <div className="mb-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 text-blue-900 dark:text-blue-200 text-sm flex items-start space-x-3">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {language === 'am' ? 'የረዳት ስራ አስኪያጅ (Co-Manager) ሁነታ በርቷል' : 'Co-Manager Mode Active'}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed">
                  {language === 'am' 
                    ? 'ምርቶችን የመጨመር፣ ዋጋና ክምችት የማስተካከል እንዲሁም ደንበኞችን የማሻሻል የአስተዳዳሪ ፈቃድ አለዎት (ሁሉም እርምጃዎች ተመዝግበው ለዋናው አስተዳዳሪ ይቀርባሉ)። ቋሚ ስረዛዎች እና የመገለጫ ለውጦች ግን የዋናው ስራ አስኪያጅ ይሁንታ ያስፈልጋቸዋል።'
                    : 'You have managerial authority to directly add products, change prices/stock, and update customers (all actions are logged and reported to the Administrator). You can also review and approve employee activities. Permanent deletions and your personal profile changes require Business Administrator approval.'}
                </p>
              </div>
            </div>
          )}

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="rounded-xl bg-emerald-600 p-2 text-white shadow-md shadow-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('nav_admin', 'Admin & Management Hub')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'am' 
                      ? 'የቀን ሽያጭ ማጠቃለያ፣ የሰራተኞች ኦዲት ታሪክ እና የምርቶች ክምችት ቁጥጥር' 
                      : 'Daily sales reconciliation, staff audit trails, and catalog verification controls'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              {!isCoAdmin && (
                <button
                  onClick={() => setIsHireModalOpen(true)}
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('btn_hire_employee', 'Hire Staff / Co-Manager')}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-4 text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PUBLIC ONLINE STOREFRONT SHARE LINK CARD */}
          {/* ========================================================================= */}
          <div className="mb-6 rounded-3xl border border-emerald-200/90 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/80 dark:from-emerald-950/40 via-teal-50/40 dark:via-slate-900 to-white dark:to-slate-900 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start space-x-3.5">
                <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0 mt-0.5">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {language === 'am' ? 'የእርስዎ የሚጋራ የኦንላይን ሱቅ ሊንክ' : 'Your Shareable Online Store Link'}
                    </h3>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-[10px] font-black uppercase">
                      {language === 'am' ? 'መደብር' : 'Store'} #{user?.business_id || 1}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {language === 'am'
                      ? 'ይህን ልዩ ሊንክ ለደንበኞችዎ በቴሌግራም፣ በዋትስአፕ፣ በፌስቡክ ወይም በደረሰኝዎ ላይ ያጋሩ። ደንበኞች በቀጥታ መርጠው ያዛሉ፤ ትዕዛዞችም ወዲያውኑ ወደ ኦንላይን ትዕዛዞች ክፍል ይደርሳሉ።'
                      : 'Share this unique link with your customers on Telegram, WhatsApp, Facebook, TikTok, or print on your paper receipts. Customers can browse and order online directly, and their orders will arrive straight into your Online Orders terminal with automatic inventory deduction.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <Sparkles className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                      {language === 'am' ? `ለ${user?.business_name || 'ሱቅዎ'} ብቻ የተለየ` : `Isolated to ${user?.business_name || 'Your Store'} Only`}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{language === 'am' ? 'የደንበኛ ቀጥታ ትዕዛዝ' : 'Customer self-service checkout'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{language === 'am' ? 'ቴሌብር፣ ሲቢኢ ብር እና ሲደርስ በጥሬ ገንዘብ' : 'Telebirr, CBE & Cash on Delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Link Box & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:min-w-[400px]">
                <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-200 truncate shadow-2xs select-all">
                  {shareableStoreLink}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleCopyStoreLink}
                    className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                    title="Copy link to clipboard"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        {t('btn_copied', 'Copied!')}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {t('btn_copy', 'Copy Link')}
                      </>
                    )}
                  </button>

                  <a
                    href={shareableStoreLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                    title="Open Storefront in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily_report')}
              className={`flex items-center space-x-2 pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === 'daily_report'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>{language === 'am' ? 'የቀን የሂሳብ ማጠቃለያና ሪፖርቶች' : 'Daily Reconciliation & Reports'}</span>
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`flex items-center space-x-2 pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === 'activities'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{language === 'am' ? 'ማጽደቂያዎችና የኦዲት መዝገብ' : 'Pending Approvals & Audit Log'}</span>
              {pendingRequestsCount > 0 && (
                <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold animate-pulse">
                  {pendingRequestsCount} {language === 'am' ? 'ተጠባባቂ' : 'Pending'}
                </span>
              )}
              {activities.filter((a) => a.action.startsWith('COADMIN_') || (a as any).user_role === 'co_admin').length > 0 && (
                <span className="rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 px-2 py-0.5 text-xs font-bold flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {activities.filter((a) => a.action.startsWith('COADMIN_') || (a as any).user_role === 'co_admin').length} {language === 'am' ? 'ረዳት ስራ አስኪያጅ' : 'Co-Manager'}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center space-x-2 pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === 'employees'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{language === 'am' ? `ሰራተኞችና ስራ አስኪያጆች (${employees.length})` : `Staff & Co-Managers (${employees.length})`}</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: DAILY REPORT */}
          {/* ========================================================= */}
          {activeTab === 'daily_report' && (
            <div className="space-y-6">
              {/* Daily Filter Bar & Print Controls */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                    <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setQuickDate(0)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition border cursor-pointer ${
                      selectedDate === new Date().toLocaleDateString('en-CA')
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {language === 'am' ? 'ዛሬ' : 'Today'}
                  </button>

                  <button
                    onClick={() => setQuickDate(1)}
                    className="rounded-xl px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    {language === 'am' ? 'ትናንት' : 'Yesterday'}
                  </button>

                  <button
                    onClick={() => loadDailyReport(selectedDate)}
                    disabled={reportLoading}
                    className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title={t('btn_refresh', 'Refresh')}
                  >
                    <RefreshCw className={`h-4 w-4 ${reportLoading ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {language === 'am' ? 'የመደብሩ ገንዘብ:' : 'Store Currency:'} <strong className="text-emerald-700 dark:text-emerald-400">{currencyCode} ({currencySymbol})</strong>
                  </span>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition cursor-pointer"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    {t('btn_export_pdf', 'Print / Export Report')}
                  </button>
                </div>
              </div>

              {/* Printable Header (Visible only on print) */}
              <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
                <h1 className="text-2xl font-black text-slate-900">{user?.business_name || 'Retail Business'} - Daily Reconciliation Report</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Report Date: {selectedDate} | Generated on: {new Date().toLocaleString()} | Active Currency: {currencyCode} ({currencySymbol})
                </p>
              </div>

              {reportLoading && !dailyReport ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : dailyReport ? (
                <>
                  {/* Top Key Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Revenue */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                          {language === 'am' ? 'የቀን ገቢ' : 'Daily Revenue'}
                        </span>
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {currencySymbol} {dailyReport.summary.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {dailyReport.summary.total_sales_count} {language === 'am' ? 'ሽያጮች ተጠናቀዋል' : 'tickets completed'}
                      </p>
                    </div>

                    {/* Units Sold */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                          {language === 'am' ? 'ዛሬ የተሸጡ ዕቃዎች' : 'Units Sold Today'}
                        </span>
                        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 p-2 text-blue-600 dark:text-blue-400">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {dailyReport.summary.total_units_sold.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {language === 'am' ? 'የተሰጡ ጠቅላላ ዕቃዎች' : 'Total items dispensed'}
                      </p>
                    </div>

                    {/* Total Remaining Stock */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                          {language === 'am' ? 'ቀሪ ክምችት' : 'Remaining Inventory'}
                        </span>
                        <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300">
                          <Package className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {dailyReport.summary.total_remaining_stock.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {language === 'am' ? `በ${dailyReport.summary.total_inventory_items} ምርቶች ውስጥ` : `Across ${dailyReport.summary.total_inventory_items} total catalog products`}
                      </p>
                    </div>

                    {/* EMPTY Items Alert */}
                    <div className={`rounded-2xl border p-5 shadow-sm ${
                      dailyReport.summary.empty_products_count > 0 
                        ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/40 ring-1 ring-red-200 dark:ring-red-900' 
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-red-700 dark:text-red-400">
                          {language === 'am' ? 'ያለቁ ዕቃዎች (0 ክምችት)' : 'Empty Items (0 Stock)'}
                        </span>
                        <div className="rounded-xl bg-red-100 dark:bg-red-950/70 p-2 text-red-600 dark:text-red-400">
                          <AlertOctagon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-red-700 dark:text-red-400 tracking-tight">
                        {dailyReport.summary.empty_products_count}
                      </p>
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-semibold">
                        {dailyReport.summary.empty_products_count > 0 
                          ? (language === 'am' ? 'አስቸኳይ ክምችት ያስፈልጋል!' : 'Requires immediate restock!') 
                          : (language === 'am' ? 'ምንም ሙሉ በሙሉ ያለቀ የለም' : 'No completely empty items')}
                      </p>
                    </div>

                    {/* Low Stock Items Alert */}
                    <div className={`rounded-2xl border p-5 shadow-sm ${
                      dailyReport.summary.low_stock_products_count > 0 
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/40 ring-1 ring-amber-200 dark:ring-amber-900' 
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
                          {language === 'am' ? 'አነስተኛ ክምችት ማስጠንቀቂያ' : 'Low Stock Warning'}
                        </span>
                        <div className="rounded-xl bg-amber-100 dark:bg-amber-950/70 p-2 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight">
                        {dailyReport.summary.low_stock_products_count}
                      </p>
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        {language === 'am' ? 'ከጣሪያው በታች የቀሩ' : 'Below threshold level'}
                      </p>
                    </div>
                  </div>

                  {/* Section: Staff Daily Performance & Payment Methods */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Staff Breakdown */}
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {language === 'am' ? `የሰራተኞች ሽያጭና አፈፃፀም (${selectedDate})` : `Staff Sales & Performance (${selectedDate})`}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {language === 'am' ? 'የገንዘብ ተቀባይና የአስተዳደር ዝርዝር' : 'Cashier & Management breakdown'}
                        </span>
                      </div>

                      {dailyReport.staff_sales.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                          {language === 'am' ? 'በዚህ ቀን በሰራተኞች የተመዘገበ ሽያጭ የለም።' : 'No sales recorded by staff on this date.'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
                              <tr>
                                <th className="px-4 py-3">{language === 'am' ? 'ሰራተኛ' : 'Staff Member'}</th>
                                <th className="px-4 py-3">{language === 'am' ? 'ሚና' : 'Role'}</th>
                                <th className="px-4 py-3 text-right">{language === 'am' ? 'ሽያጮች' : 'Transactions'}</th>
                                <th className="px-4 py-3 text-right">{language === 'am' ? 'የተሸጠ ብዛት' : 'Units Sold'}</th>
                                <th className="px-4 py-3 text-right">{language === 'am' ? 'ገቢ' : 'Revenue'} ({currencySymbol})</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                              {dailyReport.staff_sales.map((s, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                    {s.user_name}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      s.role === 'admin' 
                                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300' 
                                        : s.role === 'co_admin' 
                                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}>
                                      {s.role === 'co_admin' ? (language === 'am' ? 'ረዳት ስራ አስኪያጅ' : 'Co-Manager') : s.role.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                    {s.sales_count}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                                    {s.units_sold}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                                    {currencySymbol} {s.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Payment Methods Breakdown */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {language === 'am' ? 'የክፍያ ዘዴዎች ክፍፍል' : 'Payment Breakdown'}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {language === 'am' ? 'ጠቅላላ:' : 'Total:'} {currencySymbol} {dailyReport.summary.total_revenue.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
                        {dailyReport.payment_methods.length === 0 ? (
                          <div className="text-center text-slate-400 dark:text-slate-500 text-xs">
                            {language === 'am' ? 'ዛሬ የተመዘገበ የክፍያ ዝውውር የለም።' : 'No payment transactions recorded today.'}
                          </div>
                        ) : (
                          dailyReport.payment_methods.map((p, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {p.method === 'Cash' ? (language === 'am' ? 'ጥሬ ገንዘብ' : 'Cash') : p.method}
                                </span>
                                <div className="text-right">
                                  <span className="font-black text-slate-900 dark:text-white">
                                    {currencySymbol} {p.amount.toFixed(2)}
                                  </span>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1.5">({p.percentage}%)</span>
                                </div>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, p.percentage)}%` }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section: Items Sold Today */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {language === 'am' ? `በ${selectedDate} የተሸጡ ዕቃዎች` : `Items Sold on ${selectedDate}`}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {dailyReport.items_sold.length} {language === 'am' ? 'የተለያዩ የተሸጡ ምርቶች' : 'distinct products sold'}
                      </span>
                    </div>

                    {dailyReport.items_sold.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                        {language === 'am' ? 'በዚህ ቀን የተሸጠ ምንም ምርት የለም።' : 'No product items sold on this date.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
                            <tr>
                              <th className="px-4 py-3">{language === 'am' ? 'የምርት ስም' : 'Product Name'}</th>
                              <th className="px-4 py-3">{language === 'am' ? 'ምድብ' : 'Category'}</th>
                              <th className="px-4 py-3 text-right">{language === 'am' ? 'የተሸጠ ብዛት' : 'Quantity Sold'}</th>
                              <th className="px-4 py-3 text-right">{language === 'am' ? 'የአንዱ ዋጋ' : 'Unit Price'}</th>
                              <th className="px-4 py-3 text-right">{language === 'am' ? 'ጠቅላላ ገቢ' : 'Total Revenue'} ({currencySymbol})</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {dailyReport.items_sold.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                  {item.product_name}
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                  {item.category_name || (language === 'am' ? 'ያልተመደበ' : 'Uncategorized')}
                                </td>
                                <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200">
                                  {item.quantity_sold}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                  {currencySymbol} {item.unit_price.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                                  {currencySymbol} {item.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section: Live Catalog Stock & Remaining Inventory */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {language === 'am' ? 'የአሁኑ የምርቶች ክምችት ማጠቃለያ' : 'Current Catalog Stock Reconciliation'}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {dailyReport.inventory_status.length} {language === 'am' ? 'የተመዘገቡ ምርቶች' : 'catalog items tracked'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
                          <tr>
                            <th className="px-4 py-3">{language === 'am' ? 'ምርት' : 'Product'}</th>
                            <th className="px-4 py-3">{language === 'am' ? 'ምድብ' : 'Category'}</th>
                            <th className="px-4 py-3 text-right">{language === 'am' ? 'ዋጋ' : 'Unit Price'}</th>
                            <th className="px-4 py-3 text-right">{language === 'am' ? 'ቀሪ ክምችት' : 'Remaining Stock'}</th>
                            <th className="px-4 py-3 text-center">{language === 'am' ? 'ሁኔታ' : 'Status'}</th>
                            <th className="px-4 py-3 text-center">{language === 'am' ? 'ማረጋገጫ' : 'Verification'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {dailyReport.inventory_status.map((inv) => {
                            const isEmpty = inv.status === 'EMPTY' || inv.remaining_stock <= 0;
                            const isLow = inv.status === 'LOW STOCK';

                            return (
                              <tr key={inv.product_id} className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition ${isEmpty ? 'bg-red-50/20 dark:bg-red-950/20' : ''}`}>
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                  {inv.product_name}
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                  {inv.category_name || (language === 'am' ? 'አጠቃላይ' : 'General')}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-semibold">
                                  {currencySymbol} {inv.price.toFixed(2)}
                                </td>
                                <td className={`px-4 py-3 text-right font-black ${isEmpty ? 'text-red-700 dark:text-red-400' : isLow ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {inv.remaining_stock}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isEmpty ? (
                                    <span className="inline-flex rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 px-2.5 py-0.5 text-[10px] font-black uppercase text-red-800 dark:text-red-300">
                                      {t('status_empty', 'EMPTY')}
                                    </span>
                                  ) : isLow ? (
                                    <span className="inline-flex rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                                      {t('status_low_stock', 'LOW STOCK')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                                      {t('status_in_stock', 'IN STOCK')}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {inv.is_verified ? (
                                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> {t('status_verified', 'Verified')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                      {t('status_pending_verification', 'Pending Verification')}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ACTIVITIES, APPROVALS & AUDIT LOG */}
          {/* ========================================================= */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              {/* Filter */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    {language === 'am' ? 'እንቅስቃሴዎችን አጣራ:' : 'Filter Activities:'}
                  </span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">{language === 'am' ? 'ሁሉም እንቅስቃሴዎች' : 'All Activities'}</option>
                  <option value="COADMIN">{language === 'am' ? 'የረዳት ስራ አስኪያጅ እንቅስቃሴዎች' : 'Co-Manager Activities & Notifications'}</option>
                  <option value="PENDING_APPROVAL">{language === 'am' ? 'ይሁንታ የሚጠብቁ (እርምጃ ያስፈልጋል)' : 'Pending Approval (Action Required)'}</option>
                  <option value="LOGGED">{language === 'am' ? 'የተመዘገቡ መደበኛ ሰራተኛ እንቅስቃሴዎች' : 'Logged Activities (Routine Staff Actions)'}</option>
                  <option value="APPROVED">{language === 'am' ? 'የጸደቁ እርምጃዎች' : 'Approved Actions'}</option>
                  <option value="DISMISSED">{language === 'am' ? 'ውድቅ የተደረጉ' : 'Dismissed'}</option>
                </select>
              </div>

              {/* Activity Cards List */}
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                  <ShieldCheck className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {language === 'am' ? 'ምንም የእንቅስቃሴ ሪፖርት አልተገኘም' : 'No activity reports found'}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {language === 'am' 
                      ? 'ሰራተኞች ምርት ሲጨምሩ፣ ሲያስተካክሉ ወይም ስረዛ ሲጠይቁ ለማጽደቅ እዚህ ይታያሉ።' 
                      : 'When employees add or edit products, customers, settings, or request deletions, they will be reported here for approval.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => {
                    const isPending = act.status === 'PENDING_APPROVAL';
                    const isDeleteReq = act.action === 'DELETE_REQUEST';
                    const isProductCreateReq = act.action === 'CREATE_PRODUCT_REQUEST';
                    const isProductUpdateReq = act.action === 'UPDATE_PRODUCT_REQUEST' || act.action === 'PRICE_STOCK_REQUEST' || act.action === 'PRICE_CHANGE_REQUEST' || act.action === 'STOCK_CHANGE_REQUEST';
                    const isCustomerCreateReq = act.action === 'CREATE_CUSTOMER_REQUEST';
                    const isCustomerUpdateReq = act.action === 'UPDATE_CUSTOMER_REQUEST';
                    const isSettingsReq = act.action === 'UPDATE_SETTINGS_REQUEST';
                    const isCoadminAction = act.action.startsWith('COADMIN_') || (act as any).user_role === 'co_admin';

                    // Parse changes payload if present
                    let payloadSummary = null;
                    if (act.payload) {
                      try {
                        const parsed = JSON.parse(act.payload);
                        payloadSummary = parsed;
                      } catch (e) {
                        // ignore
                      }
                    }

                    return (
                      <div
                        key={act.id}
                        className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm transition ${
                          isPending 
                            ? isDeleteReq 
                              ? 'border-red-300 dark:border-red-800 bg-red-50/20 dark:bg-red-950/20 ring-1 ring-red-300 dark:ring-red-900' 
                              : isProductCreateReq || isCustomerCreateReq
                              ? 'border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-300 dark:ring-blue-900'
                              : 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 ring-1 ring-amber-300 dark:ring-amber-900'
                            : isCoadminAction
                            ? 'border-purple-200 dark:border-purple-800 bg-purple-50/25 dark:bg-purple-950/30 ring-1 ring-purple-200 dark:ring-purple-900'
                            : 'border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start space-x-3.5">
                            <div className={`mt-0.5 rounded-xl p-2.5 ${
                              isDeleteReq 
                                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400' 
                                : isProductCreateReq || isCustomerCreateReq
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                                : isProductUpdateReq || isSettingsReq
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                                : isCoadminAction
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {isDeleteReq ? (
                                <AlertTriangle className="h-5 w-5" />
                              ) : isProductCreateReq || isCustomerCreateReq ? (
                                <UserPlus className="h-5 w-5" />
                              ) : isProductUpdateReq || isSettingsReq ? (
                                <DollarSign className="h-5 w-5" />
                              ) : isCoadminAction ? (
                                <Sparkles className="h-5 w-5" />
                              ) : (
                                <ShieldCheck className="h-5 w-5" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                {isCoadminAction && (
                                  <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
                                    <Sparkles className="h-2.5 w-2.5 mr-1 text-purple-600 dark:text-purple-400" />
                                    {language === 'am' ? 'የረዳት ስራ አስኪያጅ ማሳወቂያ' : 'Co-Manager Notification'}
                                  </span>
                                )}
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  isPending
                                    ? isDeleteReq 
                                      ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                    : act.status === 'APPROVED'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : act.status === 'DISMISSED'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                }`}>
                                  {act.status.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {act.action.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">
                                  {language === 'am' ? 'ዒላማ:' : 'Target:'} {act.entity_type} {act.entity_name ? `("${act.entity_name}")` : ''}
                                </span>
                              </div>

                              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                {act.details}
                              </p>

                              {/* Formatted Changes / Payload Preview */}
                              {payloadSummary && Object.keys(payloadSummary).length > 0 && (
                                <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200 flex flex-wrap gap-x-4 gap-y-1">
                                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase font-sans text-[10px] w-full">
                                    {language === 'am' ? 'ይሁንታ የሚጠብቁ ለውጦች:' : 'Pending Modifications:'}
                                  </span>
                                  {Object.entries(payloadSummary).map(([key, val]) => (
                                    <span key={key} className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                      <strong>{key}:</strong> {String(val)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-2.5 flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                                <span>{language === 'am' ? 'ያቀረበው:' : 'Reported by:'} <strong className="text-slate-800 dark:text-slate-200">{act.user_name}</strong></span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-3 w-3 text-slate-400" />
                                  {new Date(act.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for Pending Requests */}
                          {isPending && (() => {
                            const isInitiatedByCoAdmin = act.user_id === user?.id || (act as any).user_role === 'co_admin';
                            const canApprove = user?.role === 'admin' || (!isInitiatedByCoAdmin && act.action !== 'UPDATE_SETTINGS_REQUEST');

                            if (!canApprove) {
                              return (
                                <div className="flex flex-col items-end gap-1 pt-2 lg:pt-0 flex-shrink-0">
                                  <span className="inline-flex items-center rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 shadow-xs">
                                    <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    {language === 'am' ? 'የአስተዳዳሪ ይሁንታ በመጠባበቅ ላይ' : 'Pending Admin Authorization'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {language === 'am' ? 'የረዳት ስራ አስኪያጅ ተግባር ለአስተዳዳሪ ቀርቧል' : 'Co-Manager action reported to Admin'}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-row lg:flex-col items-stretch gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 flex-shrink-0">
                                {isDeleteReq ? (
                                  <button
                                    onClick={() => handleApproveActivity(act.id)}
                                    disabled={actionLoadingId === act.id}
                                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    {actionLoadingId === act.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    {language === 'am' ? 'አጽድቅና በቋሚነት ሰርዝ' : 'Approve & Permanently Delete'}
                                  </button>
                                ) : isProductCreateReq ? (
                                  <button
                                    onClick={() => handleApproveActivity(act.id)}
                                    disabled={actionLoadingId === act.id}
                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    {actionLoadingId === act.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    {language === 'am' ? 'አረጋግጥና ለሽያጭ ፍቀድ' : 'Verify & Enable for POS'}
                                  </button>
                                ) : isCustomerCreateReq ? (
                                  <button
                                    onClick={() => handleApproveActivity(act.id)}
                                    disabled={actionLoadingId === act.id}
                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    {actionLoadingId === act.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    {language === 'am' ? 'ደንበኛውን አረጋግጥና አጽድቅ' : 'Verify & Approve Customer'}
                                  </button>
                                ) : act.action === 'UPDATE_PROFILE_REQUEST' ? (
                                  <button
                                    onClick={() => handleApproveActivity(act.id)}
                                    disabled={actionLoadingId === act.id}
                                    className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    {actionLoadingId === act.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    {language === 'am' ? 'የሰራተኛውን መገለጫ አጽድቅ' : 'Approve & Update Staff Profile'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleApproveActivity(act.id)}
                                    disabled={actionLoadingId === act.id}
                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    {actionLoadingId === act.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    {language === 'am' ? 'ለውጦችን አጽድቅና ተግብር' : 'Approve & Apply Changes'}
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDismissActivity(act.id)}
                                  disabled={actionLoadingId === act.id}
                                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition cursor-pointer"
                                >
                                  {language === 'am' ? 'ጥያቄውን ውድቅ አድርግ' : 'Dismiss Request'}
                                </button>

                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteActivity(act.id)}
                                    disabled={actionLoadingId === act.id}
                                    title={language === 'am' ? 'ሪፖርቱን በቋሚነት ሰርዝ' : 'Permanently delete this activity report'}
                                    className="inline-flex items-center justify-center rounded-xl border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/40 px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    {actionLoadingId === act.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    {language === 'am' ? 'ሪፖርቱን ሰርዝ' : 'Delete Report'}
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {!isPending && user?.role === 'admin' && (
                            <div className="flex items-center justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 flex-shrink-0">
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                disabled={actionLoadingId === act.id}
                                title={language === 'am' ? 'ሪፖርቱን በቋሚነት ሰርዝ' : 'Permanently delete this activity report'}
                                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 shadow-xs disabled:opacity-50 transition cursor-pointer"
                              >
                                {actionLoadingId === act.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-red-600" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 mr-1 text-slate-400 group-hover:text-red-500" />
                                )}
                                <span>{language === 'am' ? 'ሪፖርቱን ሰርዝ' : 'Delete Report'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: STAFF & EMPLOYEES */}
          {/* ========================================================= */}
          {activeTab === 'employees' && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    {language === 'am' ? 'ንቁ የሰራተኞች መለያዎች' : 'Active Staff Accounts'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'am'
                      ? 'ሰራተኞች እና ረዳት ስራ አስኪያጆች የሽያጭ መዝገብን ማስተዳደር ይችላሉ፤ ነገር ግን የምርት መጨመር፣ ማስተካከል እና መሰረዝ የአስተዳዳሪ ማረጋገጫ ያስፈልጋል።'
                      : 'Employees and co-managers can manage POS sales, but catalog additions, edits, and deletions require admin verification'}
                  </p>
                </div>
                {!isCoAdmin && (
                  <button
                    onClick={() => setIsHireModalOpen(true)}
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    {language === 'am' ? 'አዲስ ሰራተኛ ቅጠር' : 'Hire Staff Member'}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">{language === 'am' ? 'ስም / የተጠቃሚ ስም' : 'Name / Username'}</th>
                      <th className="px-6 py-4">{language === 'am' ? 'ኢሜይል' : 'Email'}</th>
                      <th className="px-6 py-4">{language === 'am' ? 'ሚና' : 'Role'}</th>
                      <th className="px-6 py-4">{language === 'am' ? 'ፈቃዶች' : 'Permissions'}</th>
                      <th className="px-6 py-4">{language === 'am' ? 'የተፈጠረበት ቀን' : 'Created Date'}</th>
                      <th className="px-6 py-4 text-right">{language === 'am' ? 'ተግባራት' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map((emp) => {
                      const isOwner = emp.id === user?.id;
                      const isAdmin = emp.role === 'admin';
                      const isCoManager = emp.role === 'co_admin';
                      const isDelivery = emp.role === 'delivery';

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {emp.name} {isOwner && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1">({language === 'am' ? 'እርስዎ' : 'You'})</span>}
                            </div>
                            {emp.username && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                @{emp.username}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                            {emp.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isAdmin
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 dark:border dark:border-purple-800'
                                : isCoManager
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 dark:border dark:border-blue-800'
                                : isDelivery
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            }`}>
                              {isAdmin 
                                ? (language === 'am' ? 'ዋና አስተዳዳሪ' : 'Administrator')
                                : isCoManager 
                                ? (language === 'am' ? 'ረዳት ስራ አስኪያጅ (Co-Admin)' : 'Co-Manager (Co-Admin)')
                                : isDelivery 
                                ? (language === 'am' ? 'የማድረሻ ሰራተኛ / ሹፌር' : 'Delivery Personnel')
                                : (language === 'am' ? 'ሰራተኛ / ካሸር' : 'Staff / Employee')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {isAdmin ? (
                              <span className="font-bold text-purple-700 dark:text-purple-400">
                                {language === 'am' ? 'ሙሉ ስልጣን (ማጽደቅ፣ መሰረዝ፣ ቅንብሮች)' : 'Full Authority (Approve, Delete, Settings)'}
                              </span>
                            ) : isCoManager ? (
                              <span className="text-blue-700 dark:text-blue-400 font-medium">
                                {language === 'am' ? 'ምርቶችን፣ ዋጋዎችን እና ደንበኞችን መጨመር/ማስተካከል፤ የሰራተኞች ጥያቄዎችን ማጽደቅ። መሰረዝ የአስተዳዳሪ ማረጋገጫ ይፈልጋል።' : 'Add/edit products, prices & customers (logged to Admin), approve employee requests. Deletions & profile require Admin approval'}
                              </span>
                            ) : isDelivery ? (
                              <span className="text-amber-800 dark:text-amber-400 font-medium">
                                {language === 'am' ? 'የማድረሻ ማዕከል (/delivery) • ትዕዛዝ መረከብ፣ ማድረስ እና የደንበኛ ማረጋገጫ' : 'Delivery Driver Hub (/delivery) • Order Pickup, Handover, and Customer Proof'}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400">
                                {language === 'am' ? 'POS ሽያጭ፣ ምርቶች። ለውጦች የአስተዳዳሪ ማረጋገጫ ያስፈልጋቸዋል' : 'POS, Sales, Products. Modifications require Admin verification'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(emp.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isOwner && !isCoAdmin && (
                              <button
                                onClick={() => handleRemoveEmployee(emp.id, emp.name)}
                                title={language === 'am' ? 'ሰራተኛውን አስወግድ' : 'Remove staff member'}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* HIRE STAFF MODAL WITH STRONG PASSWORD VALIDATION */}
      {/* ========================================================= */}
      <Modal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        title={language === 'am' ? 'ሰራተኛ ቅጠር / ረዳት ስራ አስኪያጅ ጨምር' : 'Hire Staff / Add Co-Manager'}
      >
        {hireError && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
            {hireError}
          </div>
        )}
        <form onSubmit={handleHireSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {language === 'am' ? 'ሙሉ ስም *' : 'Full Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={language === 'am' ? 'ምሳሌ፡ አበበ ተስፋዬ' : 'e.g. Abebe Tesfaye'}
              value={hireForm.name}
              onChange={(e) => setHireForm({ ...hireForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {language === 'am' ? 'የተጠቃሚ ስም *' : 'Username *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'am' ? 'ምሳሌ፡ abebe_cashier' : 'e.g. abebe_cashier'}
                value={hireForm.username}
                onChange={(e) => setHireForm({ ...hireForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {language === 'am' ? 'የኢሜይል አድራሻ *' : 'Email Address *'}
              </label>
              <input
                type="email"
                required
                placeholder="abebe@store.et"
                value={hireForm.email}
                onChange={(e) => setHireForm({ ...hireForm, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {language === 'am' ? 'የሚሰጠው ሚና *' : 'Assigned Role *'}
            </label>
            <select
              value={hireForm.role}
              onChange={(e) => setHireForm({ ...hireForm, role: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="employee">{language === 'am' ? 'መደበኛ ሰራተኛ / ካሸር (የሱቅ POS ሽያጭ)' : 'Standard Staff / Cashier (In-Store POS & Sales Terminal)'}</option>
              <option value="delivery">{language === 'am' ? 'የማድረሻ ሰራተኛ / ሹፌር (ትዕዛዝ ማድረሻ)' : 'Delivery Personnel / Driver (Delivery Hub & Order Dispatch)'}</option>
              <option value="co_admin">{language === 'am' ? 'ረዳት ስራ አስኪያጅ / ረዳት አድሚን (ሪፖርት መመልከት፣ ማስተዳደር)' : 'Co-Manager / Co-Admin (View Reports, Manage Store, Verified Actions)'}</option>
              <option value="admin">{language === 'am' ? 'የንግድ ስራ አስተዳዳሪ (ሙሉ ስልጣን እና ማጽደቂያ)' : 'Business Administrator (Full Authority & Approvals)'}</option>
            </select>
          </div>

          {/* Password with Strength Meter */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {language === 'am' ? 'የይለፍ ቃል (ጠንካራ መሆን አለበት) *' : 'Password (Must Be Strong) *'}
            </label>
            <input
              type="password"
              required
              placeholder={language === 'am' ? 'ምሳሌ፡ StoreAdmin#2026' : 'e.g. StoreAdmin#2026'}
              value={hireForm.password}
              onChange={(e) => setHireForm({ ...hireForm, password: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />

            {/* Strength meter bar */}
            {hireForm.password && (
              <div className="mt-2 space-y-1.5">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 rounded-full ${passScore >= 1 ? (passScore <= 2 ? 'bg-red-500' : passScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${passScore >= 3 ? (passScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${passScore >= 4 ? (passScore === 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${passScore === 5 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className={passCriteria.length ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                    {passCriteria.length ? '✓' : '○'} {language === 'am' ? '8+ ፊደላት' : '8+ characters'}
                  </span>
                  <span className={passCriteria.upper ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                    {passCriteria.upper ? '✓' : '○'} {language === 'am' ? 'የካፒታል (ትልቅ) ፊደል' : 'Uppercase letter'}
                  </span>
                  <span className={passCriteria.lower ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                    {passCriteria.lower ? '✓' : '○'} {language === 'am' ? 'ትንሽ ፊደል' : 'Lowercase letter'}
                  </span>
                  <span className={passCriteria.digit ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                    {passCriteria.digit ? '✓' : '○'} {language === 'am' ? 'ቁጥር (0-9)' : 'Number (0-9)'}
                  </span>
                  <span className={`col-span-2 ${passCriteria.symbol ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                    {passCriteria.symbol ? '✓' : '○'} {language === 'am' ? 'ምልክት (!@#$%^&*...)' : 'Symbol (!@#$%^&*...)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsHireModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {language === 'am' ? 'ይቅር' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={hireSubmitting || !isPasswordStrong}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
            >
              {hireSubmitting 
                ? (language === 'am' ? 'መለያ በመፍጠር ላይ...' : 'Creating Staff Account...') 
                : (language === 'am' ? 'አረጋግጥና ቅጠር' : 'Confirm & Hire')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
