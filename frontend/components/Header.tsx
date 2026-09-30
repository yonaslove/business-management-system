'use client';

import React from 'react';
import { Menu, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">{title}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Currency badge */}
        <div className="hidden sm:flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Currency: ETB (Birr)
        </div>

        {/* Demo status */}
        <div className="flex items-center space-x-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="hidden md:inline">{user?.business_name || 'Yoni Mini Market'}</span>
        </div>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'Y'}
        </div>
      </div>
    </header>
  );
};
