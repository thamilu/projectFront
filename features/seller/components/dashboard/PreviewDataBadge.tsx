'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/atoms/tooltip';

/**
 * Honest disclosure badge for dashboard widgets that render illustrative
 * placeholder data rather than a real backend metric.
 *
 * Several seller-dashboard widgets (revenue chart, review sentiment,
 * account-health summary, the "Action Center" task list) were built ahead
 * of the backend analytics/support-ticket/review-aggregation endpoints
 * they'd need to show real numbers — every seller currently sees identical
 * fabricated figures regardless of their actual store performance. Rather
 * than either (a) silently presenting fabricated numbers as real, or
 * (b) deleting the built UI outright before the real data source exists,
 * this makes the gap visible: a small, unmissable "Preview" label plus a
 * tooltip explaining what it means, wherever real backend data isn't wired
 * in yet. Remove this badge from a widget the moment it's fed real data.
 */
export function PreviewDataBadge({
  label = 'Preview data',
}: {
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex cursor-help items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400"
          role="status"
        >
          <Info className="h-3 w-3" aria-hidden="true" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">
        This widget shows illustrative sample data — it isn&apos;t connected to your
        real store metrics yet.
      </TooltipContent>
    </Tooltip>
  );
}
