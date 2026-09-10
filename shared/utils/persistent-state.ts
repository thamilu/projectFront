/**
 * Safe, versioned browser storage.
 *
 * Direct `localStorage` use is deceptively hazardous in a production app:
 *
 * - **It throws.** Safari's Private Browsing, Firefox's `dom.storage.enabled=false`,
 *   and enterprise policies that block site data all make `getItem` and
 *   `setItem` raise rather than return `null`. An unguarded read crashes the
 *   render that performs it.
 * - **It fills up.** `setItem` throws `QuotaExceededError` once the origin's
 *   budget is reached, typically while writing something the user just did.
 * - **It outlives its schema.** Data written by a previous release is still
 *   there after a deploy. Reading it back without a version check produces the
 *   worst class of bug: a shape mismatch surfacing as `undefined` deep inside
 *   otherwise-correct logic.
 * - **It is not reactive.** Two tabs diverge silently unless `storage` events
 *   are handled.
 *
 * This module addresses all four. Every operation is total — it returns a
 * result rather than throwing — so callers never need a try/catch.
 *
 * @module shared/utils/persistent-state
 */

import { logger } from '@/core/telemetry/logger';

/** Which browser store to use. `session` clears when the tab closes. */
export type StorageKind = 'local' | 'session';

/** Envelope written to storage. The version is what makes migration possible. */
interface StoredEnvelope<T> {
  /** Schema version. A mismatch discards the payload rather than trusting it. */
  v: number;
  /** ISO timestamp of the write, used for optional expiry. */
  at: string;
  data: T;
}

export interface PersistentStoreOptions<T> {
  /** Storage key. Namespace it (`eshop:cart:saved`) to avoid collisions. */
  key: string;
  /** Current schema version. Increment on any breaking shape change. */
  version: number;
  /** Value returned when nothing valid is stored. */
  fallback: T;
  /** `local` (default) persists across sessions; `session` does not. */
  kind?: StorageKind;
  /**
   * Runtime shape check. Storage is user-writable — a browser console, an
   * extension, or a previous release can all put arbitrary content under this
   * key — so a parsed value is untrusted input until this says otherwise.
   */
  validate: (value: unknown) => value is T;
  /** Optional lifetime. Entries older than this are treated as absent. */
  maxAgeMs?: number;
}

/**
 * A typed, guarded view over one storage key.
 *
 * @example
 * const store = createPersistentStore({
 *   key: 'eshop:cart:saved-for-later',
 *   version: 1,
 *   fallback: [],
 *   validate: (v): v is SavedItem[] => Array.isArray(v),
 * });
 *
 * const items = store.read();
 * store.write([...items, newItem]);
 */
export interface PersistentStore<T> {
  /** Read the stored value, or `fallback` if absent, stale, or invalid. */
  read(): T;
  /** Persist a value. Returns `false` if storage was unavailable or full. */
  write(value: T): boolean;
  /** Remove the key. Safe to call when it does not exist. */
  clear(): void;
  /**
   * Subscribe to writes from *other* tabs on the same origin.
   * Returns an unsubscribe function. No-op during SSR.
   */
  subscribe(onChange: (value: T) => void): () => void;
}

/**
 * Resolve the underlying Storage object.
 *
 * Returns `null` during SSR and whenever access throws — the property getter
 * itself raises in some privacy configurations, which is why even reading
 * `window.localStorage` is inside the try.
 */
function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function createPersistentStore<T>(options: PersistentStoreOptions<T>): PersistentStore<T> {
  const { key, version, fallback, kind = 'local', validate, maxAgeMs } = options;

  /** Parse and validate a raw string into `T`, or return null if unusable. */
  function decode(raw: string | null): T | null {
    if (!raw) return null;

    let envelope: unknown;
    try {
      envelope = JSON.parse(raw);
    } catch {
      // Corrupt or hand-edited. Treated as absent, not an error worth logging
      // on every read.
      return null;
    }

    if (
      !envelope ||
      typeof envelope !== 'object' ||
      (envelope as StoredEnvelope<T>).v !== version
    ) {
      // Written by a different schema version. Discarded deliberately: reading
      // a stale shape is worse than starting fresh.
      return null;
    }

    const typed = envelope as StoredEnvelope<T>;

    if (maxAgeMs !== undefined) {
      const writtenAt = Date.parse(typed.at);
      if (!Number.isFinite(writtenAt) || Date.now() - writtenAt > maxAgeMs) {
        return null;
      }
    }

    return validate(typed.data) ? typed.data : null;
  }

  return {
    read(): T {
      const storage = getStorage(kind);
      if (!storage) return fallback;

      try {
        return decode(storage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },

    write(value: T): boolean {
      const storage = getStorage(kind);
      if (!storage) return false;

      const envelope: StoredEnvelope<T> = {
        v: version,
        at: new Date().toISOString(),
        data: value,
      };

      try {
        storage.setItem(key, JSON.stringify(envelope));
        return true;
      } catch (error) {
        // Almost always QuotaExceededError. Reported so the caller can tell
        // the user their change was not saved, rather than silently losing it.
        logger.warn('[PersistentState] Write failed', {
          key,
          error: error instanceof Error ? error.name : 'UnknownError',
        });
        return false;
      }
    },

    clear(): void {
      const storage = getStorage(kind);
      if (!storage) return;
      try {
        storage.removeItem(key);
      } catch {
        // Nothing useful to do; the value is already unreachable.
      }
    },

    subscribe(onChange: (value: T) => void): () => void {
      if (typeof window === 'undefined') return () => {};

      const handler = (event: StorageEvent) => {
        // `storage` fires for every key on the origin, and also on `clear()`
        // with a null key — filter to this store's own key.
        if (event.key !== key) return;
        onChange(decode(event.newValue) ?? fallback);
      };

      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
