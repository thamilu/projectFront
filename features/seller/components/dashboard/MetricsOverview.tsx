'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { PreviewDataBadge } from './PreviewDataBadge';

interface MetricsOverviewProps {
  catalogUsed: number;
  catalogLimit: number;
}

/**
 * Regression: this widget previously had two additional panels —
 * "Account Health 98% Excellent" and "Conversion Ratio 2.4% vs 1.8% avg" —
 * both entirely hardcoded with no props at all, and a third,
 * "KYC Verification: Approved / Premium Plan / Expires in 24 Days" panel
 * that unconditionally claimed every seller's KYC was Approved regardless
 * of their actual verification status. That KYC claim in particular was a
 * false compliance representation, not just decorative filler — removed
 * outright rather than labeled, since there is no honest way to badge a
 * false "Approved" status as merely a preview. The Conversion Ratio panel
 * is kept but explicitly labeled as preview data (no real per-store
 * conversion analytics exist yet); Account Health is removed since there is
 * no real per-seller "health score" concept in the current data model at
 * all — inventing one, even labeled, would just be a different fabrication.
 */
export function MetricsOverview({
  catalogUsed = 0,
  catalogLimit = 500,
}: MetricsOverviewProps) {
  const capacityPercent = catalogLimit > 0 ? Math.round((catalogUsed / catalogLimit) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Catalog Capacity Limit — real data */}
      <div
        tabIndex={0}
        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
            Available: <span className="text-slate-300 font-semibold">{Math.max(catalogLimit - catalogUsed, 0)} items</span>
          </p>
        </div>
      </div>

      {/* Conversion Ratio — no real per-store analytics backend yet */}
      <div
        tabIndex={0}
        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
      >
        <div className="space-y-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
            Conversion Ratio
            <PreviewDataBadge />
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-500 tracking-tight flex items-center gap-1.5">
              <TrendingUp className="h-5.5 w-5.5 text-emerald-500 shrink-0" aria-hidden="true" />
              2.4%
            </p>
          </div>
          <p className="text-xs text-slate-400">Sample figure — real conversion analytics coming soon.</p>
        </div>
      </div>
    </div>
  );
}
