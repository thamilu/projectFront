/**
 * Tests for the canonical relative-time formatter.
 *
 * [CONTRACT CHANGE] These assertions were updated when the implementation moved
 * from a hand-rolled English ladder (`${n} min ago`) to
 * `Intl.RelativeTimeFormat`. Two behaviours changed deliberately:
 *
 * 1. **Output is locale-aware.** The old version emitted English fragments into
 *    an otherwise localised page. Tests now pin an explicit locale rather than
 *    depending on whatever the deployment default happens to be.
 * 2. **Future timestamps stay relative** ("in 1 hour"). The old version fell
 *    back to a bare `toLocaleDateString()`, losing the relative framing on
 *    exactly the case — an estimated delivery date — where it is most useful.
 */

import { formatRelativeTime } from '@/shared/utils/format-relative-time';

/** Fixed "now", so every case is deterministic regardless of when CI runs. */
const NOW = new Date('2026-06-21T20:00:00.000Z').getTime();

/** Pinned so assertions do not depend on the deployment's configured locale. */
const LOCALE = 'en-IN';

/** Build an ISO timestamp offset from the frozen "now". */
function at(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('formatRelativeTime', () => {
  describe('degenerate input', () => {
    it('returns an empty string for empty input', () => {
      expect(formatRelativeTime('', LOCALE)).toBe('');
    });

    it('returns the raw value for an unparseable timestamp', () => {
      // Never "Invalid Date", which is what a bare `new Date()` would render.
      expect(formatRelativeTime('not-a-date', LOCALE)).toBe('not-a-date');
    });
  });

  describe('recent past', () => {
    it('reads "Just now" inside the first minute', () => {
      expect(formatRelativeTime(at(-30 * SECOND), LOCALE)).toBe('Just now');
    });

    it.each([
      [-5 * MINUTE, '5 minutes ago'],
      [-1 * HOUR, '1 hour ago'],
      [-2 * HOUR, '2 hours ago'],
      [-3 * DAY, '3 days ago'],
    ])('formats an offset of %ims as "%s"', (offset, expected) => {
      expect(formatRelativeTime(at(offset), LOCALE)).toBe(expected);
    });

    it('truncates toward zero rather than rounding up', () => {
      // 1.9 hours elapsed must read "1 hour ago" — never the not-yet-true
      // "2 hours ago".
      expect(formatRelativeTime(at(-1.9 * HOUR), LOCALE)).toBe('1 hour ago');
    });
  });

  describe('larger units', () => {
    it('picks the largest sensible unit rather than a large day count', () => {
      // 61 days reads as "2 months ago", not "61 days ago".
      expect(formatRelativeTime(at(-61 * DAY), LOCALE)).toBe('2 months ago');
    });

    it('uses natural wording where the locale provides it', () => {
      // `numeric: 'auto'` yields "yesterday" instead of "1 day ago".
      expect(formatRelativeTime(at(-1 * DAY), LOCALE)).toBe('yesterday');
    });
  });

  describe('future timestamps', () => {
    it('keeps future times relative', () => {
      expect(formatRelativeTime(at(1 * HOUR), LOCALE)).toBe('in 1 hour');
      expect(formatRelativeTime(at(2 * DAY), LOCALE)).toBe('in 2 days');
    });

    it('treats an imminent future time as "Just now"', () => {
      // Symmetric with the past: a clock skew of a few seconds should not
      // produce "in 0 minutes".
      expect(formatRelativeTime(at(10 * SECOND), LOCALE)).toBe('Just now');
    });
  });
});
