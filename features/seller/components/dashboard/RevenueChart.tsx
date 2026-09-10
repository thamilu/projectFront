'use client';

import React, { useState, useMemo } from 'react';
import { Download, BarChart3, Check } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';
import { PreviewDataBadge } from './PreviewDataBadge';

export type Timeframe = '7D' | '30D' | '90D' | '1Y';

interface RevenueChartProps {
  activeTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

export function RevenueChart({ activeTimeframe, onTimeframeChange }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(true); // Toggle previous period overlay
  
  const chartDatasets: Record<Timeframe, { label: string; current: number; previous: number; orders: number; conv: number }[]> = {
    '7D': [
      { label: 'Mon', current: 1200, previous: 900, orders: 4, conv: 1.8 },
      { label: 'Tue', current: 2400, previous: 1800, orders: 8, conv: 2.1 },
      { label: 'Wed', current: 1900, previous: 2100, orders: 6, conv: 1.9 },
      { label: 'Thu', current: 3200, previous: 2500, orders: 11, conv: 2.5 },
      { label: 'Fri', current: 2800, previous: 3000, orders: 9, conv: 2.2 },
      { label: 'Sat', current: 4100, previous: 3500, orders: 15, conv: 2.8 },
      { label: 'Sun', current: 3800, previous: 3100, orders: 13, conv: 2.6 },
    ],
    '30D': [
      { label: 'Wk 1', current: 4200, previous: 3800, orders: 14, conv: 2.0 },
      { label: 'Wk 2', current: 5800, previous: 4900, orders: 22, conv: 2.2 },
      { label: 'Wk 3', current: 8400, previous: 7200, orders: 31, conv: 2.5 },
      { label: 'Wk 4', current: 9900, previous: 8100, orders: 38, conv: 2.7 },
    ],
    '90D': [
      { label: 'Apr', current: 11000, previous: 9500, orders: 48, conv: 2.3 },
      { label: 'May', current: 13500, previous: 12100, orders: 59, conv: 2.6 },
      { label: 'Jun', current: 12000, previous: 12800, orders: 51, conv: 2.4 },
    ],
    '1Y': [
      { label: 'Q1', current: 9500, previous: 8200, orders: 38, conv: 2.1 },
      { label: 'Q2', current: 11200, previous: 10400, orders: 47, conv: 2.3 },
      { label: 'Q3', current: 13800, previous: 12600, orders: 58, conv: 2.6 },
      { label: 'Q4', current: 15000, previous: 14100, orders: 65, conv: 2.8 },
    ],
  };

  const chartData = chartDatasets[activeTimeframe];
  const maxRevenue = 16000;
  const width = 500;
  const height = 280;
  const paddingX = 45;
  const paddingY = 25;

  // Calculate points for current period
  const currentPoints = useMemo(() => {
    return chartData.map((d, i) => {
      const x = paddingX + (i * (width - 2 * paddingX)) / (chartData.length - 1);
      const y = height - paddingY - (d.current / maxRevenue) * (height - 2 * paddingY);
      return { x, y };
    });
  }, [chartData]);

  // Calculate points for previous period
  const previousPoints = useMemo(() => {
    return chartData.map((d, i) => {
      const x = paddingX + (i * (width - 2 * paddingX)) / (chartData.length - 1);
      const y = height - paddingY - (d.previous / maxRevenue) * (height - 2 * paddingY);
      return { x, y };
    });
  }, [chartData]);

  const currentLinePath = currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const currentAreaPath = `${currentLinePath} L ${currentPoints[currentPoints.length - 1].x},${height - paddingY} L ${currentPoints[0].x},${height - paddingY} Z`;

  const previousLinePath = previousPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Title Area and dataset controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-indigo-500" />
              Revenue Trends & Comparisons
              <PreviewDataBadge />
            </h3>
            <p className="text-xs text-slate-400">Monthly e-commerce storefront revenue performance overview</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Compare Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
              aria-pressed={compareMode}
              className={cn(
                "h-7 rounded-lg text-[9px] font-black uppercase tracking-wider px-2 transition-all",
                compareMode
                  ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/30 border-l-2 border-l-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.15)]"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              {compareMode && <Check className="h-3 w-3 mr-1" />}
              Compare Prev
            </Button>
            
            {/* Export CSV chart */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Export chart data"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            {/* Timeframe switchers */}
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
              {(['7D', '30D', '90D', '1Y'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    onTimeframeChange(tf);
                    setHoveredIndex(null);
                  }}
                  className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg transition-colors cursor-pointer",
                    activeTimeframe === tf
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>Current Period (₹)</span>
          </div>
          {compareMode && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-600 border border-dashed border-slate-400" />
              <span>Previous Period (₹)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-300" />
            <span>Orders count</span>
          </div>
        </div>

        {/* The Graphic Canvas Container */}
        <div className="relative mt-2">
          {/* Active node tooltip overlay */}
          {hoveredIndex !== null && chartData[hoveredIndex] && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-25 bg-slate-950/95 border border-slate-800 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-center space-y-1">
              <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">
                {chartData[hoveredIndex].label} Metrics
              </p>
              <div className="flex items-center gap-3.5 text-xs font-semibold text-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px]">Sales:</span> ₹{chartData[hoveredIndex].current.toLocaleString('en-IN')}
                </div>
                {compareMode && (
                  <div>
                    <span className="text-slate-500 text-[10px]">Prev:</span> ₹{chartData[hoveredIndex].previous.toLocaleString('en-IN')}
                  </div>
                )}
                <div>
                  <span className="text-slate-455 text-[10px]">Orders:</span> {chartData[hoveredIndex].orders}
                </div>
              </div>
            </div>
          )}

          <div className="relative flex-1 min-h-[320px] flex items-center justify-center pr-2 pl-10">
            {/* Y-Axis Value Guides */}
            <div className="absolute left-0 top-5 bottom-5 flex flex-col justify-between text-[11px] font-mono text-slate-400 font-bold select-none text-right w-9">
              <span>₹16K</span>
              <span>₹12K</span>
              <span>₹8K</span>
              <span>₹4K</span>
              <span>₹0</span>
            </div>

            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
              <defs>
                <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const yVal = paddingY + ratio * (height - 2 * paddingY);
                return (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={yVal}
                    x2={width - paddingX}
                    y2={yVal}
                    stroke="currentColor"
                    className="text-slate-800/40 dark:text-slate-800/60"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Previous period dashed comparison series */}
              {compareMode && (
                <path
                  d={previousLinePath}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  className="opacity-70"
                />
              )}

              {/* Current Period Area and main line */}
              <path d={currentAreaPath} fill="url(#revenueAreaGrad)" />
              <path d={currentLinePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Highlight interaction dots */}
              {currentPoints.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === i ? "6.5" : "4.5"}
                    fill="#090514"
                    stroke={hoveredIndex === i ? "#a5b4fc" : "#6366f1"}
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="transition-all duration-150 cursor-pointer"
                  />
                </g>
              ))}

              {/* X-Axis labels */}
              {chartData.map((d, i) => {
                const x = paddingX + (i * (width - 2 * paddingX)) / (chartData.length - 1);
                return (
                  <text
                    key={i}
                    x={x}
                    y={height - 2}
                    textAnchor="middle"
                    className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-sans"
                    fill="currentColor"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
