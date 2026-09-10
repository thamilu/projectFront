/**
 * Human-relative timestamp formatting.
 *
 * Canonical home for this concern — `shared/utils/formatters.ts` deliberately
 * does not define its own copy. Two implementations of the same function under
 * the same name is how "3 hours ago" and "3 hour ago" end up on adjacent
 * screens.
 *
 * @module shared/utils/format-relative-time
 */

import { env } from '@/env';

const DEFAULT_LOCALE = env.NEXT_PUBLIC_DEFAULT_LOCALE;

/**
 * Bucketing thresholds, largest unit first.
 *
 * Ordered so the first match wins, which yields the largest sensible unit —
 * "2 months ago" rather than "61 days ago".
 */
const RELATIVE_TIME_UNITS: ReadonlyArray<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
];

/** Below this, "Just now" reads better than "in 0 seconds" / "12 seconds ago". */
const JUST_NOW_THRESHOLD_SECONDS = 60;

/**
 * Render a timestamp as human-relative text — "3 hours ago", "in 2 days".
 *
 * Built on `Intl.RelativeTimeFormat` rather than a hand-rolled ladder of
 * template strings. That choice buys correct pluralisation and word order in
 * every locale the app is configured for, at no bundle cost — where the
 * previous implementation hardcoded English (`${n} min ago`) and so produced
 * English fragments inside an otherwise localised page.
 *
 * Future timestamps are formatted relatively too ("in 2 days"), since an
 * estimated delivery date uses the same formatter as a notification timestamp.
 * The previous version fell back to a bare `toLocaleDateString()` for those,
 * which lost the relative framing entirely.
 *
 * @param timestamp ISO 8601 string, as received over JSON.
 * @param locale    BCP 47 tag; defaults to the deployment's configured locale.
 * @returns Relative text; `''` for empty input, and the original string when it
 *          cannot be parsed — never `Invalid Date`.
 */
export function formatRelativeTime(timestamp: string, locale: string = DEFAULT_LOCALE): string {
  if (!timestamp) return '';

  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return timestamp;

  const deltaSeconds = (parsed - Date.now()) / 1000;
  const absoluteSeconds = Math.abs(deltaSeconds);

  if (absoluteSeconds < JUST_NOW_THRESHOLD_SECONDS) return 'Just now';

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const { unit, seconds } of RELATIVE_TIME_UNITS) {
    if (absoluteSeconds >= seconds) {
      // Truncated toward zero so an elapsed 1.9 hours reads "1 hour ago",
      // never the not-yet-true "2 hours ago".
      return formatter.format(Math.trunc(deltaSeconds / seconds), unit);
    }
  }

  return formatter.format(Math.trunc(deltaSeconds / 60), 'minute');
}
