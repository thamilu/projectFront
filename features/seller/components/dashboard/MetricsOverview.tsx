'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react';

interface MetricsOverviewProps {
  catalogUsed: number;
  catalogLimit: number;
  conversionRate: number;
}

export function MetricsOverview({
  catalogUsed = 180,
  catalogLimit = 500,
  conversionRate = 2.4
}: MetricsOverviewProps) {
  const capacityPercent = Math.round((catalogUsed / catalogLimit) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Account Health */}
      <div
        tabIndex={0}
        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-2">
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Account Health</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-1.5">
              <CheckCircle2 className="h-5.5 w-5.5 text-emerald-400 shrink-0" />
              98%
            </p>
            <span className="text-[10px] font-bold text-slate-350 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Excellent</span>
          </div>
          <p className="text-xs text-slate-400">
            Seller Level 3 • <span className="text-slate-300">24/7 Priority Support</span>
          </p>
        </div>
      </div>

      {/* 2. KYC Verification */}
      <div
        tabIndex={0}
        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-2">
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">KYC Verification</p>
          <p className="text-xl font-black text-blue-400 tracking-tight flex items-center gap-1.5">
            <ShieldCheck className="h-5.5 w-5.5 text-blue-400 shrink-0" />
            Approved
          </p>
          <p className="text-xs text-slate-400">
            Premium Plan • <span className="text-slate-300">Expires in 24 Days</span>
          </p>
        </div>
      </div>

      {/* 3. Catalog Capacity Limit */}
      <div
        tabIndex={0}
        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold uppercase tracking-wider">
            <span>Catalog Limit</span>
            <span className="text-slate-300 font-mono">{catalogUsed} / {catalogLimit} SKUs</span>
          </div>
          
          {/* Thicker Progress bar with percentage inside */}
          <div className="relative h-4.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex items-center justify-center">
            <div
              className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${capacityPercent}%` }}
            />
            <span className="relative z-10 text-[9px] font-black text-white mix-blend-difference select-none">
              {capacityPercent}% utilized
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Available: <span className="text-slate-300 font-semibold">{catalogLimit - catalogUsed} items</span>
          </p>
        </div>
      </div>

      {/* 4. Conversion Ratio */}
      <div
        tabIndex={0}
        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-2">
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Conversion Ratio</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-500 tracking-tight flex items-center gap-1.5">
              <TrendingUp className="h-5.5 w-5.5 text-emerald-500 shrink-0 animate-pulse" />
              {conversionRate}%
            </p>
            <span className="text-[9px] font-bold text-slate-450">vs 1.8% avg</span>
          </div>
          <p className="text-xs text-slate-400">
            Yesterday: <span className="text-slate-300 font-semibold font-mono">1.9%</span> • Industry Avg: <span className="text-slate-400">1.8%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
