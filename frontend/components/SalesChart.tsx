'use client';

import React from 'react';
import { SalesChartPoint } from '@/types';

interface SalesChartProps {
  data: SalesChartPoint[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No sales recorded in this period</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 100);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Sales Trend</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Daily revenue performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Daily Total</span>
        </div>
      </div>

      <div className="h-60 flex items-end gap-3 pt-6 pb-2 px-2">
        {data.map((item, index) => {
          const heightPercent = Math.max((item.amount / maxAmount) * 100, 4);
          const dateObj = new Date(item.date);
          const dayName = isNaN(dateObj.getTime())
            ? item.date
            : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

          return (
            <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white text-xs rounded-lg py-1.5 px-2.5 shadow-lg whitespace-nowrap">
                <span className="font-bold">{item.amount.toLocaleString()}</span>
                <span className="text-slate-300 block text-[10px]">{item.order_count} {item.order_count === 1 ? 'sale' : 'sales'}</span>
              </div>

              {/* Bar */}
              <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg relative flex items-end h-full overflow-hidden">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-500 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-sm"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Label */}
              <span className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">
                {dayName.split(',')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
