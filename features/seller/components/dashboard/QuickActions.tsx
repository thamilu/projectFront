'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { Plus, Percent, ShoppingCart, MessageSquare, LineChart, FileText } from 'lucide-react';
import { cn } from '@/shared/utils';

/**
 * Regression: each shortcut previously carried a hardcoded "usage" stat
 * ("12 uses this wk", "3 active coupon", "18 ready today", etc.) shown in a
 * hover tooltip — fabricated numbers with no real usage-telemetry backend.
 * The shortcuts themselves are real, working navigation links; only the
 * fake usage stat has been removed rather than labeled, since a tooltip
 * whose only content is a fabricated number has no honest fallback content
 * worth keeping — the keyboard shortcut is already shown inline via <kbd>.
 */
export function QuickActions() {
  const quickActions = [
    {
      label: 'Add Product',
      desc: 'List catalog items',
      shortcut: 'Ctrl + N',
      icon: Plus,
      href: '/seller/products/add',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      label: 'Create Discount',
      desc: 'Run catalog campaigns',
      shortcut: 'Ctrl + D',
      icon: Percent,
      href: '/seller/marketing/coupons',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    },
    {
      label: 'Ship Orders',
      desc: 'Dispatch orders queue',
      shortcut: 'Ctrl + H',
      icon: ShoppingCart,
      href: '/seller/orders',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      label: 'Reply Messages',
      desc: 'Respond to buyers',
      shortcut: 'Ctrl + M',
      icon: MessageSquare,
      href: '/seller/messages',
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    },
    {
      label: 'Generate Report',
      desc: 'Export sales reports',
      shortcut: 'Ctrl + R',
      icon: LineChart,
      href: '/seller/reports',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Export Orders',
      desc: 'Download CSV audit',
      shortcut: 'Ctrl + E',
      icon: FileText,
      href: '/seller/orders/export',
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-base font-black text-white">Quick Actions</h3>
          <p className="text-xs text-slate-400">High efficiency shortcuts for store operations</p>
        </div>

        {/* Dense Grid Layout to avoid large padding and improve spatial utility */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} passHref>
              <Button
                variant="outline"
                className="w-full flex flex-col items-start justify-between p-4 rounded-xl border-slate-800 hover:bg-slate-800/50 hover:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all bg-slate-950/40 text-left focus-visible:ring-2 focus-visible:ring-indigo-500 select-none group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={cn("p-1.5 rounded-lg border group-hover:scale-105 transition-transform", action.color)}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  {/* Action Shortcut Label hint */}
                  <kbd className="hidden sm:inline bg-slate-900 text-[8px] font-mono text-slate-500 border border-slate-800 px-1 py-0.2 rounded leading-none select-none">
                    {action.shortcut}
                  </kbd>
                </div>

                <div className="space-y-0.5 mt-2.5">
                  <span className="text-[11px] font-black text-white group-hover:text-indigo-400 transition-colors block truncate">
                    {action.label}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate leading-none">
                    {action.desc}
                  </span>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
