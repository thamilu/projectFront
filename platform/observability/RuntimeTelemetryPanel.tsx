'use client';

import React, { useState, useEffect } from 'react';
import { diagnostics } from './diagnostics';

/**
 * Premium glassmorphic HUD dashboard for runtime telemetry & diagnostics
 */
export function RuntimeTelemetryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'circuits' | 'apis' | 'system'>('circuits');

  useEffect(() => {
    if (!isOpen) return;

    // Pull telemetry snapshot every 2 seconds
    const interval = setInterval(() => {
      setSnapshot(diagnostics.getSnapshot());
    }, 2000);

    setSnapshot(diagnostics.getSnapshot());
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        // z-[9999], not z-50: the site header is also `sticky z-50` and sits
        // later in the DOM (see app/layout.tsx — HydrationTracker renders
        // before <Header>), so with equal z-index the header would paint on
        // top of this panel's own header/close button wherever they
        // overlap, making the panel impossible to close once opened. This
        // matches the z-[9999]/z-[10000] convention already used elsewhere
        // in this codebase for overlays that must sit above all app chrome
        // (SkipLink.tsx, NoScriptFallback.tsx).
        className="group fixed right-4 bottom-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-300 hover:scale-110 hover:border-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
        title="Open Runtime Telemetry"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
        </span>
        <svg
          className="ml-1 h-5 w-5 text-slate-400 transition-colors duration-300 group-hover:text-violet-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="animate-slide-in fixed inset-y-0 right-0 z-[9999] flex w-96 flex-col border-l border-slate-800 bg-slate-950/90 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>
          <h2 className="text-sm font-semibold tracking-wider text-violet-400 uppercase">
            Runtime Telemetry
          </h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 transition-colors hover:text-slate-100"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-800/80 bg-slate-900/30 text-xs font-semibold">
        {(['circuits', 'apis', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === tab
                ? 'border-b-2 border-violet-500 bg-slate-900/40 text-violet-400'
                : 'text-slate-400 hover:bg-slate-900/10 hover:text-slate-200'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {snapshot ? (
          <>
            {/* TAB: CIRCUITS */}
            {activeTab === 'circuits' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Circuit Breakers Status
                </h3>
                {snapshot.circuits.length === 0 ? (
                  <div className="rounded-lg border border-slate-900 p-6 text-center text-xs text-slate-500 italic">
                    No active circuit metrics. Execute requests to mount circuits.
                  </div>
                ) : (
                  snapshot.circuits.map((c: any) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <span className="font-mono text-xs font-medium text-slate-300">
                        {c.name.toUpperCase()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.state === 'CLOSED'
                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                            : c.state === 'HALF_OPEN'
                              ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                              : 'animate-pulse border border-rose-500/20 bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {c.state}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: APIS */}
            {activeTab === 'apis' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  API Performance Metrics
                </h3>
                {snapshot.apiPerformance.length === 0 ? (
                  <div className="rounded-lg border border-slate-900 p-6 text-center text-xs text-slate-500 italic">
                    No API metrics logged yet. Make HTTP requests to capture metrics.
                  </div>
                ) : (
                  snapshot.apiPerformance.map((api: any) => (
                    <div
                      key={api.endpoint}
                      className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs"
                    >
                      <div
                        className="truncate font-mono font-semibold text-slate-300"
                        title={api.endpoint}
                      >
                        {api.endpoint}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>
                          Calls: <span className="font-mono text-slate-200">{api.callsCount}</span>
                        </div>
                        <div>
                          Failures:{' '}
                          <span className="font-mono text-rose-400">{api.failuresCount}</span>
                        </div>
                        <div>
                          Avg Latency:{' '}
                          <span className="font-mono text-emerald-400">
                            {api.averageLatencyMs}ms
                          </span>
                        </div>
                        <div>
                          p95 Latency:{' '}
                          <span className="font-mono text-violet-400">{api.p95LatencyMs}ms</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: SYSTEM */}
            {activeTab === 'system' && (
              <div className="space-y-4 text-xs">
                {/* Latency / Budget Info */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Core Metrics Budgets
                  </h3>
                  <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hydration Time:</span>
                      <span className="font-mono text-slate-200">
                        {snapshot.browserPerformance.hydrationTimeMs
                          ? `${snapshot.browserPerformance.hydrationTimeMs}ms`
                          : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Layout Shifts (CLS Limit Exceeded):</span>
                      <span className="font-mono text-amber-400">
                        {snapshot.browserPerformance.layoutShiftsExceededCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">FCP Budget Exceeded:</span>
                      <span className="font-mono text-amber-400">
                        {snapshot.browserPerformance.fcpExceededCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">LCP Budget Exceeded:</span>
                      <span className="font-mono text-amber-400">
                        {snapshot.browserPerformance.lcpExceededCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Render Budget Exceeded:</span>
                      <span className="font-mono text-amber-400">
                        {snapshot.browserPerformance.renderBudgetExceededCount ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route Payload Exceeded:</span>
                      <span className="font-mono text-amber-400">
                        {snapshot.browserPerformance.routePayloadBudgetExceededCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Browser Context */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Browser Environment
                  </h3>
                  <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3 font-mono text-[10px] text-slate-400">
                    {typeof snapshot.browserPerformance.browserContext === 'object' ? (
                      <>
                        <div className="truncate">
                          URL:{' '}
                          <span className="text-slate-200">
                            {snapshot.browserPerformance.browserContext.url}
                          </span>
                        </div>
                        {snapshot.browserPerformance.browserContext.memoryUsage && (
                          <div className="flex justify-between">
                            <span>JS Heap Used:</span>
                            <span className="text-emerald-400">
                              {
                                snapshot.browserPerformance.browserContext.memoryUsage
                                  .usedJSHeapSizeMb
                              }
                              MB /{' '}
                              {
                                snapshot.browserPerformance.browserContext.memoryUsage
                                  .totalJSHeapSizeMb
                              }
                              MB
                            </span>
                          </div>
                        )}
                        <div>
                          Uptime: <span className="text-slate-200">{snapshot.uptimeSeconds}s</span>
                        </div>
                      </>
                    ) : (
                      <span className="italic">Non-browser scope</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 italic">
            Loading telemetry signals...
          </div>
        )}
      </div>

      {/* Footer and Self-Check Triggers */}
      <div className="border-t border-slate-800 bg-slate-900/30 p-4">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).__diagnostics) {
              (window as any).__diagnostics.triggerSelfCheck();
              alert('Diagnostics report successfully written to browser logger consoles.');
            }
          }}
          className="w-full rounded-lg bg-violet-600 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-all duration-300 hover:bg-violet-700 hover:shadow-[0_0_15px_rgba(139,92,246,0.6)] active:bg-violet-800"
        >
          Execute Platform Self-Check
        </button>
      </div>
    </div>
  );
}
export default RuntimeTelemetryPanel;
