'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  ShoppingBag,
  Settings, 
  Store,
  LogOut,
  X,
  ShieldCheck,
  UserCheck,
  Truck
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  let navigation = [];
  if (user?.role === 'delivery') {
    navigation = [
      { name: t('nav_delivery', 'Delivery Hub'), href: '/delivery', icon: Truck },
    ];
  } else if (user?.role === 'employee') {
    navigation = [
      { name: t('nav_dashboard', 'Staff Workspace'), href: '/employee', icon: LayoutDashboard },
      { name: t('nav_sales', 'Sales & POS'), href: '/sales', icon: ShoppingCart },
      { name: t('nav_products', 'Products & Stock'), href: '/products', icon: Package },
      { name: t('nav_customers', 'Customers'), href: '/customers', icon: Users },
    ];
  } else {
    // Admin & Co-Admin
    navigation = [
      { name: t('nav_dashboard', 'Dashboard'), href: '/dashboard', icon: LayoutDashboard },
      { name: t('nav_products', 'Products & Stock'), href: '/products', icon: Package },
      { name: t('nav_customers', 'Customers'), href: '/customers', icon: Users },
      { name: t('nav_sales', 'Sales & POS'), href: '/sales', icon: ShoppingCart },
      { name: t('nav_orders', 'Online Orders'), href: '/orders', icon: ShoppingBag },
      { name: t('nav_delivery', 'Delivery Hub'), href: '/delivery', icon: Truck },
      { name: t('nav_employees', 'Staff Workspace'), href: '/employee', icon: UserCheck },
      { name: t('nav_admin', 'Admin & Reports'), href: '/admin', icon: ShieldCheck },
      { name: t('nav_settings', 'Settings'), href: '/settings', icon: Settings },
    ];
  }


  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Store className="h-6 w-6" />
            </div>
            <div className="truncate">
              <span className="text-base font-bold tracking-tight text-white block truncate">
                {user?.business_name || 'Business Manager'}
              </span>
              <span className="text-xs text-emerald-400 font-medium">Retail ERP • {user?.currency || 'ETB'}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <Icon className={`mr-3.5 h-5 w-5 flex-shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User footer & logout */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">
            <div className="truncate pr-2">
              <div className="flex items-center space-x-1.5">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Staff'}</p>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                  user?.role === 'admin' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : user?.role === 'co_admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : user?.role === 'delivery'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'co_admin' ? 'Co-Admin' : user?.role === 'delivery' ? 'Delivery' : 'Staff'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
