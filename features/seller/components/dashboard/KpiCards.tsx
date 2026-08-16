'use client';

import React from 'react';
import { DollarSign, ShoppingCart, Activity, Package, ArrowUpRight, TrendingUp, Star } from 'lucide-react';
import { Badge } from '@/shared/ui/atoms/badge';

interface KpiCardsProps {
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  onNavigate: (tab: string) => void;
}

export function KpiCards({
  totalRevenue = 42580,
  pendingOrders = 18,
  lowStockProducts = 5,
  onNavigate
}: KpiCardsProps) {

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Today's Revenue Card */}
      <div
        onClick={() => onNavigate('/seller/finance')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('/seller/finance')}
        tabIndex={0}
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-850 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-350">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Today's Revenue</span>
            </div>
            <span className="text-emerald-400 text-xs font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +18%
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-black text-white italic tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            {/* Sparkline mini-visualization */}
            <div className="h-8 w-20 shrink-0 select-none" aria-hidden="true">
              <svg width="100%" height="100%" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="revenueSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,35 Q15,10 30,28 T60,8 T90,25 L100,20 L100,40 L0,40 Z"
                  fill="url(#revenueSpark)"
                />
                <path
                  d="M0,35 Q15,10 30,28 T60,8 T90,25 L100,20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>Yesterday: ₹36,400</span>
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
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-850 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-350">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Fulfillment Queue</span>
            </div>
            <Badge className="bg-purple-500/15 border-purple-500/20 text-purple-400 text-[9px] font-bold uppercase py-0.5 px-2">Today</Badge>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-black text-white italic tracking-tight">
              {pendingOrders} Orders
            </div>
            {/* Fulfillment progress visual */}
            <div className="w-16 h-8 shrink-0 flex items-center justify-center select-none" aria-hidden="true">
              <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative flex items-center justify-center">
                <div className="absolute left-0 top-0 h-full bg-purple-500 rounded-full" style={{ width: '60%' }} />
                <span className="relative z-10 text-[7px] font-black text-white mix-blend-difference select-none">60%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>Processing: {Math.round(pendingOrders * 0.6)}</span>
          <span className="text-indigo-400 hover:text-white uppercase tracking-widest text-[9px] flex items-center gap-0.5">
            Ship Queue <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* 3. Store Performance Card */}
      <div
        onClick={() => onNavigate('/seller/reviews')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('/seller/reviews')}
        tabIndex={0}
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-850 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-350">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Store Performance</span>
            </div>
            <span className="text-emerald-450 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ★ Active
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-black text-white italic tracking-tight">
              4.8 / 5.0
            </div>
            {/* Visual Mini Rating stars indicator */}
            <div className="flex text-amber-400 gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>Return Rate: 1.2%</span>
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
        className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-850 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-350">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Inventory Status</span>
            </div>
            <Badge className="bg-orange-500/15 border-orange-500/20 text-orange-400 text-[9px] font-bold uppercase py-0.5 px-2">Critical</Badge>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-black text-white italic tracking-tight">
              {lowStockProducts} Alerts
            </div>
            {/* Warning stock gauge progress visualization */}
            <div className="w-16 h-8 shrink-0 flex items-center justify-center select-none" aria-hidden="true">
              <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative flex items-center justify-center">
                <div className="absolute left-0 top-0 h-full bg-orange-500 rounded-full" style={{ width: '80%' }} />
                <span className="relative z-10 text-[7px] font-black text-white mix-blend-difference select-none">80%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>Out of Stock: <span className="text-rose-550 font-bold">1 item</span></span>
          <span className="text-indigo-400 hover:text-white uppercase tracking-widest text-[9px] flex items-center gap-0.5">
            Restock <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
