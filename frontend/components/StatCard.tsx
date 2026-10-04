'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
}

const variantStyles = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/60',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/60',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/60',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900/60',
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-900/60',
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald',
}) => {
  const styles = variantStyles[variant];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
