'use client';

import React from 'react';
import { DollarSign, ShoppingCart, Activity, Package, ArrowUpRight, Star } from 'lucide-react';
import { Badge } from '@/shared/ui/atoms/badge';
import { PreviewDataBadge } from './PreviewDataBadge';

interface KpiCardsProps {
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  onNavigate: (tab: string) => void;
}

/**
 * Regression: every card here previously carried fabricated supplementary
 * numbers alongside its one real prop — a fixed "+18%" trend badge and
 * "Yesterday: ₹36,400" on the revenue card, a fixed 60% progress bar and a
 * fabricated "Processing: X" estimate (Math.round(pendingOrders * 0.6)) on
 * the fulfillment card, a completely fictional "4.8/5.0" rating and "Return
 * Rate: 1.2%" with no backing data at all, and a hardcoded "Out of Stock: 1
 * item" that showed even for a seller with zero out-of-stock products.
 * Fabricated numbers sitting directly next to real ones are worse than
 * fabricated numbers alone — they borrow the real prop's credibility. This
 * keeps only what's actually knowable from props; the one card with no real
 * data source at all (Store Performance/ratings) is explicitly labeled
 * rather than presenting invented numbers as real.
 */
export function KpiCards({
  totalRevenue = 0,
  pendingOrders = 0,
  lowStockProducts = 0,
  onNavigate
}: KpiCardsProps) {

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Today's Revenue Card */}
      <div
        onClick={() => onNavigate('/seller/finance')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('/seller/finance')}
        tabIndex={0}
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
            </div>
          </div>

          <div className="text-2xl font-black text-white italic tracking-tight">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-bold text-slate-400">
          <span className="text-indigo-400 hover:text-white uppercase tracking-widest text-[9px] flex items-center gap-0.5">
            Details <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* 2. Fulfillment Queue Card */}
      <div
        onClick={() => onNavigate('/seller/orders')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('/seller/orders')}
        tabIndex={0}
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Fulfillment Queue</span>
            </div>
            <Badge className="bg-purple-500/15 border-purple-500/20 text-purple-400 text-[9px] font-bold uppercase py-0.5 px-2">Today</Badge>
          </div>

          <div className="text-2xl font-black text-white italic tracking-tight">
            {pendingOrders} {pendingOrders === 1 ? 'Order' : 'Orders'}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-bold text-slate-400">
          <span className="text-indigo-400 hover:text-white uppercase tracking-widest text-[9px] flex items-center gap-0.5">
            Ship Queue <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* 3. Store Performance Card — no real ratings/returns backend yet */}
      <div
        onClick={() => onNavigate('/seller/reviews')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('/seller/reviews')}
        tabIndex={0}
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Store Performance</span>
            </div>
            <PreviewDataBadge />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-black text-white italic tracking-tight">
              4.8 / 5.0
            </div>
            <div className="flex text-amber-400 gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-bold text-slate-400">
          <span className="text-indigo-400 hover:text-white uppercase tracking-widest text-[9px] flex items-center gap-0.5">
            Reviews <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* 4. Inventory Status Card */}
      <div
        onClick={() => onNavigate('/seller/inventory')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('/seller/inventory')}
        tabIndex={0}
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Inventory Status</span>
            </div>
            {lowStockProducts > 0 && (
              <Badge className="bg-orange-500/15 border-orange-500/20 text-orange-400 text-[9px] font-bold uppercase py-0.5 px-2">Needs Attention</Badge>
            )}
          </div>

          <div className="text-2xl font-black text-white italic tracking-tight">
            {lowStockProducts} {lowStockProducts === 1 ? 'Alert' : 'Alerts'}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-bold text-slate-400">
          <span className="text-indigo-400 hover:text-white uppercase tracking-widest text-[9px] flex items-center gap-0.5">
            Restock <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
