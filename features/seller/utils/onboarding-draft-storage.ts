/**
 * Single owner of the seller-onboarding draft kept in browser storage.
 *
 * Three raw `localStorage` keys were previously read and written directly from
 * two components across fourteen call sites, with no shared definition. The
 * predictable consequences, all of which were live:
 *
 * - **The timestamp was formatted at write time and stored as display text.**
 *   `now.toLocaleDateString() + ' ' + now.toLocaleTimeString()` — with no locale
 *   argument, so it used whatever locale the *writing browser* had rather than
 *   the app's configured one. On an `en-IN` deployment showing ₹ prices, the
 *   resume banner rendered `7/9/2026 11:37:16 pm`: US `M/D/YYYY`, and ambiguous
 *   with `D/M/YYYY` — 7 September or 9 July, unknowable from the string.
 * - **A stored display string cannot be reasoned about.** It cannot be
 *   reformatted, localised, or compared, so a draft abandoned two months ago was
 *   offered in exactly the same words as one saved two minutes ago.
 * - **The two write sites disagreed.** One wrote `toLocaleTimeString()`, the
 *   other a `{ hour, minute, second }` variant, so the rendered format depended
 *   on which code path last saved.
 * - **The two read sites disagreed.** Missing timestamps fell back to
 *   `'Recently'` in one component and `'Previous Session'` in the other.
 *
 * The fix is to store an **ISO 8601 instant** and format at render time. That
 * keeps the value comparable (enabling the staleness check below) and lets the
 * UI present it in the reader's locale through `formatRelativeTime`.
 *
 * @module features/seller/utils/onboarding-draft-storage
 */

import { createPersistentStore } from '@/shared/utils/persistent-state';

// ============================================================
// 1. MODEL
// ============================================================

/**
 * A persisted onboarding draft.
 *
 * The three previously-separate keys are one record, so a draft can never be
 * half-written — the old layout allowed `data` to be saved while `saved-at`
 * failed, leaving a draft with no age.
 */
export interface OnboardingDraft {
  /** Sanitised form values. Shape is owned by the form, not by this module. */
  readonly data: Record<string, unknown>;
  /** Zero-based wizard step the user had reached. */
  readonly step: number;
  /** ISO 8601 instant of the last save. Never a pre-formatted display string. */
  readonly savedAt: string;
}

/**
 * Age past which a draft is treated as stale.
 *
 * Not deleted — the work is the user's and discarding it silently would be
 * worse than offering it. The UI surfaces the age so the choice is informed.
 */
export const DRAFT_STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1_000; // 30 days

/**
 * Age past which a draft is discarded outright on read.
 *
 * A draft this old is near-certainly abandoned, and onboarding drafts contain
 * personal and KYC-adjacent detail. Retaining that indefinitely in browser
 * storage is a data-minimisation problem, not merely clutter.
 */
export const DRAFT_EXPIRES_AFTER_MS = 90 * 24 * 60 * 60 * 1_000; // 90 days

// ============================================================
// 2. STORE
// ============================================================

function isOnboardingDraft(value: unknown): value is OnboardingDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as OnboardingDraft;
  return (
    typeof draft.data === 'object' &&
    draft.data !== null &&
    typeof draft.step === 'number' &&
    Number.isInteger(draft.step) &&
    draft.step >= 0 &&
    typeof draft.savedAt === 'string' &&
    Number.isFinite(Date.parse(draft.savedAt))
  );
}

/**
 * Versioned at 2 deliberately: version 1 is the legacy three-key layout, whose
 * timestamp was an unparseable locale string. Bumping means any surviving
 * legacy draft is discarded rather than misread — the safe outcome, since its
 * `savedAt` could not be interpreted reliably in any case.
 */
const draftStore = createPersistentStore<OnboardingDraft | null>({
  key: 'eshop:seller:onboarding-draft',
  version: 2,
  fallback: null,
  maxAgeMs: DRAFT_EXPIRES_AFTER_MS,
  validate: (value): value is OnboardingDraft | null =>
    value === null || isOnboardingDraft(value),
});

/** Legacy keys, cleared on first successful write so they cannot linger. */
const LEGACY_KEYS = [
  'seller-onboarding-data',
  'seller-onboarding-step',
  'seller-onboarding-saved-at',
] as const;

function clearLegacyKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage unavailable; nothing to clean up.
  }
}

// ============================================================
// 3. PUBLIC API
// ============================================================

/** Age classification, used by the UI to frame the resume prompt honestly. */
export type DraftFreshness = 'fresh' | 'stale';

export interface LoadedDraft extends OnboardingDraft {
  /** Milliseconds since the draft was saved. */
  readonly ageMs: number;
  readonly freshness: DraftFreshness;
}

/**
 * Persist the draft.
 *
 * @returns `false` when storage was unavailable or full, so the caller can tell
 *          the user their progress was *not* saved rather than implying it was.
 */
export function saveOnboardingDraft(draft: {
  data: Record<string, unknown>;
  step: number;
}): boolean {
  const written = draftStore.write({
    data: draft.data,
    step: draft.step,
    // The single source of the save time, in the only format that survives
    // being read back by a different locale, device or release.
    savedAt: new Date().toISOString(),
  });

  if (written) clearLegacyKeys();
  return written;
}

/**
 * Read the draft, or `null` when there is none, it is unreadable, or it has
 * passed {@link DRAFT_EXPIRES_AFTER_MS}.
 */
export function loadOnboardingDraft(): LoadedDraft | null {
  const draft = draftStore.read();
  if (!draft) return null;

  const savedAtMs = Date.parse(draft.savedAt);
  if (!Number.isFinite(savedAtMs)) return null;

  const ageMs = Math.max(0, Date.now() - savedAtMs);

  return {
    ...draft,
    ageMs,
    freshness: ageMs > DRAFT_STALE_AFTER_MS ? 'stale' : 'fresh',
  };
}

/** Remove the draft. Called on successful submission and on explicit discard. */
export function clearOnboardingDraft(): void {
  draftStore.clear();
  clearLegacyKeys();
}
