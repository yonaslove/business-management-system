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
  Filter
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { Employee, ActivityLog } from '@/types';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'employees' | 'activities'>('activities');

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Hire Employee Modal
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [hireForm, setHireForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [hireError, setHireError] = useState<string | null>(null);

  // Deletion approval state
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadData = async () => {
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

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      loadData();
    }
  }, [user, authLoading, router, statusFilter]);

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.name || !hireForm.email || !hireForm.password) {
      setHireError('Please fill in all employee fields.');
      return;
    }

    setHireSubmitting(true);
    setHireError(null);
    try {
      await apiRequest('/admin/employees', {
        method: 'POST',
        body: JSON.stringify(hireForm),
      });
      setIsHireModalOpen(false);
      setHireForm({ name: '', email: '', password: '', role: 'employee' });
      loadData();
    } catch (err: any) {
      setHireError(err.message || 'Failed to hire staff member.');
    } finally {
      setHireSubmitting(false);
    }
  };

  const handleRemoveEmployee = async (empId: number, empName: string) => {
    if (!confirm(`Are you sure you want to remove staff member "${empName}"?`)) return;
    try {
      await apiRequest(`/admin/employees/${empId}`, {
        method: 'DELETE',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove employee.');
    }
  };

  const handleApproveActivity = async (id: number) => {
    setActionLoadingId(id);
    try {
      await apiRequest(`/admin/activities/${id}/approve`, {
        method: 'POST',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve activity.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissActivity = async (id: number) => {
    setActionLoadingId(id);
    try {
      await apiRequest(`/admin/activities/${id}/dismiss`, {
        method: 'POST',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss activity.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const pendingRequestsCount = activities.filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title="Admin & Staff Control" 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Admin Control Center
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Manage employees, monitor employee price changes, and authorize permanent deletions
              </p>
            </div>

            <button
              onClick={() => setIsHireModalOpen(true)}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Hire / Add Staff
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex items-center space-x-2 pb-3 px-4 text-sm font-bold border-b-2 transition ${
                activeTab === 'activities'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Employee Reports & Audit Log</span>
              {pendingRequestsCount > 0 && (
                <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold">
                  {pendingRequestsCount} Pending
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center space-x-2 pb-3 px-4 text-sm font-bold border-b-2 transition ${
                activeTab === 'employees'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Staff & Employees ({employees.length})</span>
            </button>
          </div>

          {/* TAB 1: ACTIVITIES & AUDIT LOG */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              {/* Filter */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Filter Activities:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="">All Activities</option>
                  <option value="PENDING_APPROVAL">Pending Approval (Deletion Requests)</option>
                  <option value="LOGGED">Logged Activities (Price Changes / Actions)</option>
                  <option value="APPROVED">Approved Actions</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>

              {/* Activity Cards List */}
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                  <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">No activity reports yet</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    When employees change prices or request item deletions, they will be reported here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => {
                    const isPending = act.status === 'PENDING_APPROVAL';
                    const isPriceChange = act.action === 'PRICE_CHANGE';
                    const isDeleteReq = act.action === 'DELETE_REQUEST';
                    const isPriceStockReq = act.action === 'PRICE_STOCK_REQUEST' || act.action === 'PRICE_CHANGE_REQUEST' || act.action === 'STOCK_CHANGE_REQUEST';
                    const isPermDelete = act.action === 'DELETE_PERMANENT';

                    return (
                      <div
                        key={act.id}
                        className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                          isPending 
                            ? isDeleteReq 
                              ? 'border-red-300 bg-red-50/20 ring-1 ring-red-300' 
                              : 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300'
                            : 'border-slate-200/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3.5">
                            <div className={`mt-0.5 rounded-xl p-2.5 ${
                              isDeleteReq 
                                ? 'bg-red-50 text-red-600' 
                                : isPriceStockReq || isPriceChange 
                                ? 'bg-amber-50 text-amber-600' 
                                : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {isDeleteReq ? (
                                <AlertTriangle className="h-5 w-5" />
                              ) : isPriceStockReq || isPriceChange ? (
                                <DollarSign className="h-5 w-5" />
                              ) : (
                                <ShieldCheck className="h-5 w-5" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  isPending
                                    ? isDeleteReq 
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : act.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : act.status === 'DISMISSED'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {act.status.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs font-semibold text-slate-600">
                                  {act.action.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <p className="mt-2 text-sm font-bold text-slate-900 leading-snug">
                                {act.details}
                              </p>

                              <div className="mt-2 flex items-center space-x-3 text-xs text-slate-500">
                                <span>Reported by: <strong className="text-slate-700">{act.user_name}</strong></span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-3 w-3 text-slate-400" />
                                  {new Date(act.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Admin Action Buttons for Pending Requests */}
                          {isPending && (
                            <div className="flex sm:flex-col lg:flex-row items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              {isDeleteReq ? (
                                <button
                                  onClick={() => handleApproveActivity(act.id)}
                                  disabled={actionLoadingId === act.id}
                                  className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition"
                                >
                                  {actionLoadingId === act.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  Approve & Permanently Delete
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApproveActivity(act.id)}
                                  disabled={actionLoadingId === act.id}
                                  className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                                >
                                  {actionLoadingId === act.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  Approve & Apply Changes
                                </button>
                              )}

                              <button
                                onClick={() => handleDismissActivity(act.id)}
                                disabled={actionLoadingId === act.id}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
                              >
                                Dismiss
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

          {/* TAB 2: STAFF & EMPLOYEES */}
          {activeTab === 'employees' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Staff Members</h3>
                  <p className="text-xs text-slate-500">
                    Employees can record sales and add products, but only administrators can permanently delete items
                  </p>
                </div>
                <button
                  onClick={() => setIsHireModalOpen(true)}
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add Staff
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Permissions</th>
                      <th className="px-6 py-4">Hired Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => {
                      const isOwner = emp.id === user?.id;
                      const isAdmin = emp.role === 'admin';

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {emp.name} {isOwner && <span className="text-xs text-slate-400 font-normal">(You)</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                            {emp.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isAdmin
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isAdmin ? 'Administrator' : 'Employee / Staff'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {isAdmin ? (
                              <span className="font-semibold text-emerald-700">Full Access (Can Delete Permanently)</span>
                            ) : (
                              <span className="text-slate-500">POS, Sales, Add/Edit (Deletions require approval)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(emp.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isOwner && (
                              <button
                                onClick={() => handleRemoveEmployee(emp.id, emp.name)}
                                title="Remove staff member"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
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

      {/* Hire Employee Modal */}
      <Modal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        title="Hire / Add Staff Member"
      >
        {hireError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {hireError}
          </div>
        )}
        <form onSubmit={handleHireSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600">Staff Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Abebe Tesfaye"
              value={hireForm.name}
              onChange={(e) => setHireForm({ ...hireForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600">Email Address (Login Username) *</label>
            <input
              type="email"
              required
              placeholder="staff@yourstore.et"
              value={hireForm.email}
              onChange={(e) => setHireForm({ ...hireForm, email: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600">Temporary Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={hireForm.password}
              onChange={(e) => setHireForm({ ...hireForm, password: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600">Assigned Role</label>
            <select
              value={hireForm.role}
              onChange={(e) => setHireForm({ ...hireForm, role: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="employee">Employee / Cashier (Standard Staff)</option>
              <option value="admin">Administrator (Co-manager)</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Standard employees cannot permanently delete products or customers without admin approval. Price changes are logged.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsHireModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={hireSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
            >
              {hireSubmitting ? 'Creating...' : 'Hire Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
