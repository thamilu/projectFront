'use client';

import React from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  ChevronDown,
  RefreshCw,
  Calendar,
  Download,
  SlidersHorizontal,
  FileText,
  FileSpreadsheet,
  FileType
} from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/shared/ui/atoms/dropdown-menu';

interface DashboardHeaderProps {
  userName: string;
  lastRefreshedText: string;
  loading: boolean;
  onRefresh: () => void;
  onCustomizeClick: () => void;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export function DashboardHeader({
  userName,
  lastRefreshedText,
  loading,
  onRefresh,
  onCustomizeClick,
  selectedTimeframe,
  onTimeframeChange
}: DashboardHeaderProps) {
  const timeframes = [
    { value: '7D', label: 'Last 7 Days' },
    { value: '30D', label: 'Last 30 Days' },
    { value: '90D', label: 'Last 90 Days' },
    { value: '1Y', label: 'Last Year' }
  ];

  return (
    <div className="flex flex-col gap-5 border-b border-slate-800/80 pb-5">
      {/* Breadcrumbs and Title Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          {/* Breadcrumb path */}
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500" aria-label="Breadcrumb">
            <span>Seller Center</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300">Dashboard</span>
          </nav>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-indigo-500" />
              Seller Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Welcome back, <span className="font-semibold text-slate-200">{userName || 'Seller'}</span>
          </p>
        </div>

        {/* Global Toolbar actions.
            [REMOVED] A "Store Switcher" listing fake stores ('Main
            Storefront', 'Secondary US Store', 'EU Expansion Store') used to
            render here — the backend data model is one store per seller
            (sellerApi.getMyStore() takes no id, and there is no store-list
            endpoint anywhere in API_ENDPOINTS.SELLER), and selecting a
            different fake "store" never actually filtered any dashboard
            data. Removed rather than left as a UI affordance for a feature
            that doesn't exist, matching this engagement's wishlist
            precedent (a genuinely single-item backend model doesn't get a
            multi-item switcher UI). */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-white text-xs font-semibold text-slate-300 gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>{timeframes.find(t => t.value === selectedTimeframe)?.label || 'Select Date'}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
              <DropdownMenuLabel className="text-slate-500 text-[10px] uppercase font-bold">Select Range</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {timeframes.map((tf) => (
                <DropdownMenuItem
                  key={tf.value}
                  onClick={() => onTimeframeChange(tf.value)}
                  className="hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white text-xs"
                >
                  {tf.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Live Sync Status and Refresh */}
          <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl h-9">
            <span className="text-[10px] text-slate-400 font-mono" aria-live="polite">
              {lastRefreshedText}
            </span>
            <Button
              onClick={onRefresh}
              disabled={loading}
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Refresh metrics"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Widget Layout Customization */}
          <Button
            onClick={onCustomizeClick}
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-white text-xs font-semibold text-slate-300 gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Customize Layout</span>
          </Button>

          {/* Export Dashboard (CSV/Excel/PDF) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-white text-xs font-semibold text-slate-300 gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                <span>Export</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
              <DropdownMenuLabel className="text-slate-500 text-[10px] uppercase font-bold">Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {/* [NOT WIRED UP] No real export-generation backend exists yet
                  — these previously had no onClick at all, so clicking them
                  silently did nothing with no feedback. */}
              <DropdownMenuItem
                onClick={() => toast.info('CSV export is coming soon.')}
                className="hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white text-xs gap-2"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                CSV Export
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info('Excel export is coming soon.')}
                className="hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white text-xs gap-2"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                Excel Export
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info('PDF report export is coming soon.')}
                className="hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white text-xs gap-2"
              >
                <FileType className="h-3.5 w-3.5 text-rose-400" />
                PDF Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
