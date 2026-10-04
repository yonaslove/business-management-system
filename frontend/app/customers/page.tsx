'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2 
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { apiRequest } from '@/lib/api';
import { Customer } from '@/types';

export default function CustomersPage() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'amber' } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
      const data = await apiRequest<Customer[]>(url);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
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
      loadCustomers();
    }
  }, [user, authLoading, search]);

  const handleOpenAdd = () => {
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setActiveCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (c: Customer) => {
    setActiveCustomer(c);
    setIsDeleteModalOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setFormError(language === 'am' ? 'እባክዎ የደንበኛውን ሙሉ ስም ያስገቡ' : 'Please provide customer full name.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await apiRequest<any>('/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      if (res?.is_verified === false) {
        setNotification({
          message: language === 'am' ? 'ደንበኛው ለአስተዳዳሪው ማረጋገጫ ተልኳል።' : 'Customer submitted for administrator verification.',
          type: 'amber',
        });
      } else {
        setNotification({
          message: language === 'am' ? 'ደንበኛው በተሳካ ሁኔታ ተመዝግቧል።' : 'Customer registered successfully.',
          type: 'success',
        });
      }
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;

    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await apiRequest<any>(`/customers/${activeCustomer.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setIsEditModalOpen(false);
      if (res?.status === 'PENDING_APPROVAL') {
        setNotification({
          message: res.message || (language === 'am' ? 'የደንበኛ ማስተካከያ ለአስተዳዳሪው ይሁንታ ተልኳል።' : 'Customer update submitted for admin approval.'),
          type: 'amber',
        });
      } else {
        setNotification({
          message: language === 'am' ? 'ደንበኛው በተሳካ ሁኔታ ተስተካክሏል።' : 'Customer updated successfully.',
          type: 'success',
        });
      }
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!activeCustomer) return;
    setFormSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; status: string }>(`/customers/${activeCustomer.id}`, {
        method: 'DELETE',
      });
      setIsDeleteModalOpen(false);
      setNotification({
        message: res.message,
        type: res.status === 'PENDING_APPROVAL' ? 'amber' : 'success',
      });
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={t('nav_customers', 'Customer Directory')} 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'ደንበኞችና መለያዎች' : 'Customers & Accounts'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'am' 
                  ? 'የታማኝ ደንበኞች መዝገብ፣ ስልክ ቁጥሮችና የሽያጭ ታሪክ' 
                  : 'Track loyal buyers, contact numbers, and total spending history'}
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('btn_add_customer', 'Add Customer')}
            </button>
          </div>

          {notification && (
            <div className={`mb-6 rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between ${
              notification.type === 'amber'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}>
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotification(null)}
                className="underline ml-4 cursor-pointer"
              >
                {language === 'am' ? 'ዝጋ' : 'Dismiss'}
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="mb-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'am' ? 'ደንበኞችን በስም፣ ስልክ ቁጥር ወይም ኢሜይል ፈልግ...' : 'Search customers by name, phone (e.g. 0911...), or email...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  {language === 'am' ? 'ምንም ደንበኛ አልተገኘም' : 'No customers found'}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {language === 'am' ? 'አዲስ ደንበኛ ይመዝግቡ ወይም ሌላ ቃል ፈልጉ።' : 'Add your first repeat customer or search with another term.'}
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> {t('btn_add_customer', 'Add Customer')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">{t('label_customer', 'Customer')}</th>
                      <th className="px-6 py-4">{t('label_phone', 'Phone')}</th>
                      <th className="px-6 py-4">{t('label_address', 'Location')}</th>
                      <th className="px-6 py-4 text-center">{language === 'am' ? 'የትዕዛዝ ብዛት' : 'Orders'}</th>
                      <th className="px-6 py-4 text-right">{language === 'am' ? 'ጠቅላላ ወጪ' : 'Lifetime Spend'} ({user?.currency_symbol || 'Br'})</th>
                      <th className="px-6 py-4 text-right">{t('label_actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <span>{c.name}</span>
                            {c.is_verified === false && (
                              <span 
                                className="rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300"
                                title="Customer account requires administrator verification"
                              >
                                {t('status_pending_verification', 'Pending Verification')}
                              </span>
                            )}
                          </div>
                          {c.email && <div className="text-xs text-slate-400 dark:text-slate-500">{c.email}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {c.phone ? (
                            <div className="flex items-center text-xs font-mono text-slate-600 dark:text-slate-300">
                              <Phone className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                              {c.phone}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                          {c.address ? (
                            <div className="flex items-center">
                              <MapPin className="mr-1.5 h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{c.address}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {c.sales_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                          {c.total_purchases.toLocaleString()} {user?.currency_symbol || 'Br'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title={t('btn_edit', 'Edit')}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(c)}
                            title={t('btn_delete', 'Delete')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('btn_add_customer', 'Add New Customer')}
      >
        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/60">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {t('label_name', 'Full Name')} *
            </label>
            <input
              type="text"
              required
              placeholder={language === 'am' ? 'ለምሳሌ፦ አበበ ከበደ' : 'e.g. Abebe Kebede'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {t('label_phone', 'Phone Number')}
              </label>
              <input
                type="text"
                placeholder="0911554433"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {language === 'am' ? 'ኢሜይል (አማራጭ)' : 'Email (Optional)'}
              </label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {t('label_address', 'Delivery / Shop Address')}
            </label>
            <input
              type="text"
              placeholder={language === 'am' ? 'ለምሳሌ፦ ቦሌ ክፍለ ከተማ፣ ወረዳ 03' : 'e.g. Bole Subcity, Woreda 03'}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('btn_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              {formSubmitting ? t('btn_saving', 'Saving...') : (language === 'am' ? 'ደንበኛ መዝግብ' : 'Save Customer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={language === 'am' ? 'የደንበኛ መረጃ አስተካክል' : 'Edit Customer'}
      >
        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/60">
            {formError}
          </div>
        )}
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {t('label_name', 'Full Name')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {t('label_phone', 'Phone Number')}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {language === 'am' ? 'ኢሜይል' : 'Email'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {t('label_address', 'Address')}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('btn_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              {formSubmitting ? t('btn_saving', 'Updating...') : (language === 'am' ? 'መረጃ አዘምን' : 'Update Customer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={user?.role === 'admin' ? (language === 'am' ? "ቋሚ ስረዛን አረጋግጥ" : "Confirm Permanent Deletion") : (language === 'am' ? "የስረዛ ጥያቄ አስገባ" : "Submit Deletion Request")}
        maxWidth="sm"
      >
        <div className="space-y-3 mb-6">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {language === 'am' ? 'የተመረጠው ደንበኛ፦' : 'Target Customer:'} <span className="font-bold text-slate-900 dark:text-white">{activeCustomer?.name}</span>
          </p>
          {user?.role === 'admin' ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'am' 
                ? 'እንደ አስተዳዳሪ ይህ ተግባር የደንበኛውን መዝገብ ከዳታቤዝ ሙሉ በሙሉ ያጠፋዋል።' 
                : 'As an administrator, this action will permanently remove the customer record from the database.'}
            </p>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold block mb-1">
                {language === 'am' ? 'የሰራተኞች የስልጣን ደንብ፦' : 'Staff Authorization Rule:'}
              </span>
              {language === 'am' 
                ? 'ደንበኞችን በቋሚነት መሰረዝ የሚችሉት አስተዳዳሪዎች ብቻ ናቸው። ይህን ማስገባት ጥያቄውን ለመደብሩ ባለቤት ይልካል።' 
                : 'Only administrators can permanently delete customer records. Submitting this will report a deletion request to the shop owner for review.'}
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {t('btn_cancel', 'Cancel')}
          </button>
          <button
            onClick={handleDeleteCustomer}
            disabled={formSubmitting}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow transition disabled:opacity-50 cursor-pointer ${
              user?.role === 'admin' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {formSubmitting
              ? t('btn_saving', 'Submitting...')
              : user?.role === 'admin'
              ? (language === 'am' ? 'በቋሚነት ሰርዝ' : 'Permanently Delete')
              : (language === 'am' ? 'የስረዛ ጥያቄ አስገባ' : 'Submit Deletion Request')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
