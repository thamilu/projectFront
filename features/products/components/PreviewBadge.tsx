import { Sparkles } from 'lucide-react';
import { cn } from '@/shared/utils';

interface PreviewBadgeProps {
  /** Extra classes for positioning — each section places this differently
   * (absolute-positioned over an image vs. inline in a text-only card). */
  className?: string;
}

/**
 * Visible indicator shown on homepage merchandising cards backed by static
 * demo/fallback data rather than a live backend response.
 *
 * Without this, a backend outage was indistinguishable from real inventory —
 * a customer (or QA engineer) had no way to tell they were looking at
 * placeholder content. Rendered only when the section's fetch fell back to
 * `constants/placeholders.ts` (see `padWithDemoData` /
 * `fetchHomepageSectionData` in `utils/fetch-with-fallback.ts`).
 */
export function PreviewBadge({ className }: PreviewBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-sm',
        className
      )}
      title="Preview content — shown while live data is unavailable"
    >
      <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
      Preview
    </span>
  );
}
