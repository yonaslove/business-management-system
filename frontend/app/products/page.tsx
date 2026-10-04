'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { apiRequest } from '@/lib/api';
import { Product, Category } from '@/types';

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'amber' } | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Quick Category creation inside Add Product form
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryCreating, setCategoryCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    sku: '',
    description: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/products?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedCategory) url += `category_id=${encodeURIComponent(selectedCategory)}&`;
      if (stockStatusFilter) url += `stock_status=${encodeURIComponent(stockStatusFilter)}&`;

      const [prodsRes, catsRes] = await Promise.all([
        apiRequest<Product[]>(url),
        apiRequest<Category[]>('/categories'),
      ]);

      setProducts(prodsRes);
      setCategories(catsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
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
      loadData();
    }
  }, [user, authLoading, search, selectedCategory, stockStatusFilter]);

  const handleQuickCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCategoryCreating(true);
    try {
      const created = await apiRequest<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      setCategories([...categories, created]);
      setFormData({ ...formData, category_id: created.id.toString() });
      setNewCategoryName('');
      setIsAddingNewCategory(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setCategoryCreating(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id.toString() : '',
      price: '',
      stock_quantity: '',
      low_stock_threshold: '10',
      sku: '',
      description: '',
    });
    setFormError(null);
    setIsAddingNewCategory(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setActiveProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id ? p.category_id.toString() : '',
      price: p.price.toString(),
      stock_quantity: p.stock_quantity.toString(),
      low_stock_threshold: p.low_stock_threshold.toString(),
      sku: p.sku || '',
      description: p.description || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (p: Product) => {
    setActiveProduct(p);
    setIsDeleteModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || formData.stock_quantity === '') {
      setFormError(language === 'am' ? 'እባክዎ የምርት ስም፣ ዋጋ እና የክምችት መጠን ያስገቡ።' : 'Please fill in product name, price, and stock quantity.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await apiRequest<any>('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
          sku: formData.sku || null,
          description: formData.description || null,
        }),
      });
      setIsAddModalOpen(false);
      if (res?.is_verified === false) {
        setNotification({
          message: language === 'am' ? 'ምርቱ ለአስተዳዳሪው ማረጋገጫ ተልኳል። ሲጸድቅ ለሽያጭ ዝግጁ ይሆናል።' : 'Product submitted for administrator verification. Once approved, it will be available for POS sales.',
          type: 'amber',
        });
      } else {
        setNotification({
          message: language === 'am' ? 'ምርቱ በተሳካ ሁኔታ ወደ ካታሎግ ተጨምሯል።' : 'Product added to inventory successfully.',
          type: 'success',
        });
      }
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await apiRequest<any>(`/products/${activeProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
          sku: formData.sku || null,
          description: formData.description || null,
        }),
      });
      setIsEditModalOpen(false);
      if (res?.status === 'PENDING_APPROVAL') {
        setNotification({
          message: res.message || (language === 'am' ? 'የዋጋ/ክምችት ለውጥ ጥያቄው ለአስተዳዳሪው ይሁንታ ተልኳል።' : 'Price/quantity change request submitted to administrator for approval.'),
          type: 'amber',
        });
      } else {
        setNotification({
          message: language === 'am' ? 'ምርቱ በተሳካ ሁኔታ ተስተካክሏል።' : 'Product updated successfully.',
          type: 'success',
        });
      }
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!activeProduct) return;
    setFormSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; status: string }>(`/products/${activeProduct.id}`, {
        method: 'DELETE',
      });
      setIsDeleteModalOpen(false);
      setNotification({
        message: res.message,
        type: res.status === 'PENDING_APPROVAL' ? 'amber' : 'success',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
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
          title={t('nav_products', 'Products & Stock')} 
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Action header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'ምርቶችና የክምችት ቁጥጥር' : 'Products & Inventory'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'am' 
                  ? 'የክምችት መጠን፣ ዋጋዎችና የማስጠንቀቂያ ጣሪያ ክትትል' 
                  : `Track stock quantities, prices in ${user?.currency || 'ETB'}, and reorder thresholds`}
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('btn_add_product', 'Add Product')}
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

          {/* Search & Filter Toolbar */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'am' ? 'በምርት ስም ወይም SKU ፈልግ...' : 'Search by product name or SKU...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">{t('shop_all_categories', 'All Categories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">{language === 'am' ? 'ሁሉም የክምችት ሁኔታዎች' : 'All Stock Levels'}</option>
                <option value="in_stock">{t('status_in_stock', 'In Stock')}</option>
                <option value="low_stock">{t('status_low_stock', 'Low Stock')}</option>
                <option value="empty">{t('status_empty', 'EMPTY (0 Stock)')}</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  {language === 'am' ? 'ምንም ምርት አልተገኘም' : 'No products found'}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {language === 'am' ? 'የፍለጋ ቃልዎን ይቀይሩ ወይም አዲስ ምርት ይጨምሩ።' : 'Try adjusting your search criteria or add your first retail item to the catalog.'}
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> {t('btn_add_product', 'Add Product')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">{language === 'am' ? 'የምርት ስም' : 'Product Name'}</th>
                      <th className="px-6 py-4">{t('label_category', 'Category')}</th>
                      <th className="px-6 py-4 text-right">{t('label_price', 'Price')} ({user?.currency_symbol || 'Br'})</th>
                      <th className="px-6 py-4 text-center">{t('label_stock', 'Stock')}</th>
                      <th className="px-6 py-4">{language === 'am' ? 'ሁኔታና ማረጋገጫ' : 'Status & Verification'}</th>
                      <th className="px-6 py-4 text-right">{t('label_actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map((p) => {
                      const isEmpty = p.stock_status === 'EMPTY' || p.stock_quantity <= 0;
                      const isLow = !isEmpty && p.stock_status === 'LOW STOCK';
                      const isVerified = p.is_verified !== false;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            <div>{p.name}</div>
                            {p.sku && <div className="text-xs font-mono text-slate-400 dark:text-slate-500">SKU: {p.sku}</div>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {p.category_name || (language === 'am' ? 'ያልተመደበ' : 'Uncategorized')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                            {p.price.toFixed(2)} {user?.currency_symbol || 'Br'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{p.stock_quantity}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">min: {p.low_stock_threshold}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                                  isEmpty
                                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                                    : isLow
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {isEmpty ? t('status_empty', 'EMPTY') : p.stock_status}
                              </span>
                              {!isVerified && (
                                <span 
                                  className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold"
                                  title="Item pending administrator verification before it can be sold"
                                >
                                  {t('status_pending_verification', 'Pending Verification')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title={t('btn_edit', 'Edit')}
                              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(p)}
                              title={t('btn_delete', 'Delete')}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('btn_add_product', 'Add New Product')}
      >
        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/60">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {language === 'am' ? 'የምርት ስም *' : 'Product Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={language === 'am' ? 'ለምሳሌ፦ ኮካ ኮላ 330 ሚሊ' : 'e.g. Coca Cola 330ml'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {t('label_price', 'Price')} ({user?.currency_symbol || 'Br'}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                placeholder="45.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {language === 'am' ? 'የመጀመሪያ ክምችት *' : 'Initial Stock *'}
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="50"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  {t('label_category', 'Category')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
                >
                  {isAddingNewCategory ? (language === 'am' ? 'ካሉት ምረጥ' : 'Select Existing') : (language === 'am' ? '+ አዲስ ምድብ' : '+ New Category')}
                </button>
              </div>

              {isAddingNewCategory ? (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    placeholder={language === 'am' ? 'የአዲሱ ምድብ ስም' : 'New category name'}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full rounded-xl border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateCategory}
                    disabled={categoryCreating || !newCategoryName.trim()}
                    className="rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                  >
                    {categoryCreating ? '...' : (language === 'am' ? 'ጨምር' : 'Add')}
                  </button>
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">{language === 'am' ? 'ያልተመደበ' : 'Uncategorized'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {language === 'am' ? 'የማስጠንቀቂያ ጣሪያ' : 'Low Stock Alert Level'}
              </label>
              <input
                type="number"
                min="0"
                placeholder="10"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {t('label_sku', 'SKU / Barcode')} ({language === 'am' ? 'አማራጭ' : 'Optional'})
            </label>
            <input
              type="text"
              placeholder="e.g. BEV-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
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
              {formSubmitting ? t('btn_saving', 'Saving...') : t('btn_save', 'Save Product')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={language === 'am' ? 'ምርት አስተካክል' : 'Edit Product'}
      >
        {user?.role !== 'admin' && (
          <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 p-3.5 text-xs text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            <span className="font-bold block mb-1">
              {language === 'am' ? 'የሰራተኞች ማረጋገጫ ማስታወሻ፦' : 'Staff Verification Notice:'}
            </span>
            {language === 'am'
              ? 'በሰራተኞች የሚደረጉ ለውጦች ከመጽደቃቸው በፊት ወደ ንግድ አስተዳዳሪው ይላካሉ።'
              : 'Modifications submitted by staff members will be sent to the Business Administrator for approval before verified.'}
          </div>
        )}
        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/60">
            {formError}
          </div>
        )}
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              {language === 'am' ? 'የምርት ስም *' : 'Product Name *'}
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
                {t('label_price', 'Price')} ({user?.currency_symbol || 'Br'}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {t('label_stock', 'Stock Quantity')} *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {t('label_category', 'Category')}
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="">{language === 'am' ? 'ያልተመደበ' : 'Uncategorized'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {language === 'am' ? 'የማስጠንቀቂያ ጣሪያ' : 'Low Stock Alert Level'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
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
              {formSubmitting
                ? t('btn_saving', 'Submitting...')
                : user?.role === 'admin'
                ? (language === 'am' ? 'ምርት አዘምን' : 'Update Product')
                : (language === 'am' ? 'ለአስተዳዳሪው ይሁንታ ላክ' : 'Submit for Admin Approval')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={user?.role === 'admin' ? (language === 'am' ? "ቋሚ ስረዛን አረጋግጥ" : "Confirm Permanent Deletion") : (language === 'am' ? "የስረዛ ጥያቄ አስገባ" : "Submit Deletion Request")}
        maxWidth="sm"
      >
        <div className="space-y-3 mb-6">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {language === 'am' ? 'የተመረጠው ምርት፦' : 'Target Product:'} <span className="font-bold text-slate-900 dark:text-white">{activeProduct?.name}</span>
          </p>
          {user?.role === 'admin' ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'am' 
                ? 'እንደ አስተዳዳሪ ይህ ተግባር ምርቱን ከካታሎግ ሙሉ በሙሉ ያጠፋዋል።' 
                : 'As an administrator, this action will permanently remove the product from the catalog.'}
            </p>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold block mb-1">
                {language === 'am' ? 'የሰራተኞች የስልጣን ደንብ፦' : 'Staff Authorization Rule:'}
              </span>
              {language === 'am' 
                ? 'ምርቶችን በቋሚነት መሰረዝ የሚችሉት አስተዳዳሪዎች ብቻ ናቸው። ይህን ማስገባት ጥያቄውን ለመደብሩ ባለቤት ይልካል።' 
                : 'Only administrators can permanently delete items. Submitting this will report a deletion request to the shop owner for review.'}
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
            onClick={handleDeleteProduct}
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
