'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { ShoppingCart, Package, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';

interface ActionCenterProps {
  pendingOrders: number;
  lowStockProducts: number;
}

/**
 * "Action Center" — a prioritized to-do list for the seller.
 *
 * Regression: this previously listed 7 tasks, only 2 of which were derived
 * from real props (pendingOrders, lowStockProducts). The other 5 — "Reply
 * to 8 Customer Messages", "Resolve Ticket #TC-92837" (a fabricated ticket
 * ID), "Submit GSTIN Documentation", "Q1 Sales Report Compilation" — were
 * hardcoded fiction with no backend data source, complete with fabricated
 * due dates and countdowns ("2h 14m remaining"). Even the 2 real tasks
 * wrapped their genuine count in fake supplementary chrome (a fixed 60%
 * progress bar, a hardcoded "2 hours ago" timestamp) unrelated to any real
 * state. Rather than keep presenting fiction as operational data, this
 * renders only what's actually knowable from real props — no fake
 * progress/countdown/timestamp, no fabricated support-ticket or
 * compliance-status entries. Extend this with real tasks only as real data
 * sources (support inbox, compliance status, returns queue) become
 * available.
 */
export function ActionCenter({ pendingOrders = 0, lowStockProducts = 0 }: ActionCenterProps) {
  const tasks = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      description: string;
      icon: typeof ShoppingCart;
      href: string;
      ctaText: string;
      urgent: boolean;
    }> = [];

    if (pendingOrders > 0) {
      items.push({
        id: 'ship-orders',
        label: `Ship ${pendingOrders} pending order${pendingOrders === 1 ? '' : 's'}`,
        description: 'Awaiting fulfillment dispatch.',
        icon: ShoppingCart,
        href: '/seller/orders',
        ctaText: 'View Orders',
        urgent: true,
      });
    }

    if (lowStockProducts > 0) {
      items.push({
        id: 'restock-products',
        label: `Restock ${lowStockProducts} low-stock product${lowStockProducts === 1 ? '' : 's'}`,
        description: 'These items are at or below their reorder threshold.',
        icon: Package,
        href: '/seller/inventory',
        ctaText: 'View Inventory',
        urgent: false,
      });
    }

    return items;
  }, [pendingOrders, lowStockProducts]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-base font-black text-white">Action Center</h3>
          <p className="text-xs text-slate-400">Items requiring your attention right now</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-2">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden="true" />
              <p className="text-xs font-semibold">You&apos;re all caught up — no action items right now.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 rounded-xl border border-slate-800/80 hover:border-slate-700/85 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none',
                  task.urgent
                    ? 'border-l-4 border-l-rose-500 bg-rose-500/5 dark:bg-rose-500/10'
                    : 'border-l-4 border-l-sky-500 bg-sky-500/5 dark:bg-sky-500/10'
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <task.icon className="h-4.5 w-4.5 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {task.label}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0">
                  <Link href={task.href} passHref>
                    <Button
                      variant={task.urgent ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-8 text-[11px] font-black uppercase rounded-lg tracking-wider px-3.5 focus-visible:ring-2 focus-visible:ring-indigo-500',
                        task.urgent
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent'
                          : 'border-slate-800 bg-slate-950/50 text-slate-200 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      {task.ctaText}
                    </Button>
                  </Link>
                  <ChevronRight className="h-4.5 w-4.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
