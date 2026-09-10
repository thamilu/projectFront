/**
 * Resilient data-fetching helpers for server-rendered homepage sections.
 *
 * @module features/products/utils/fetch-with-fallback
 */

import { isBackendAvailable } from '@/core/client/backend-health';
import { isBackendDown } from '@/core/http/utils';
import { logger } from '@/core/telemetry/logger';

/**
 * Fetches server-rendered homepage data with a resilient, observable
 * fallback path.
 *
 * Every homepage merchandising section (categories, featured products,
 * flash deals) needs the same three things: skip the network call entirely
 * when the backend is known to be down, never let a fetch failure throw
 * past this boundary, and log a structured, triaged warning distinguishing
 * "backend down" / "unauthorized (guest)" / "unexpected error" so an
 * operator can tell those apart at a glance. Extracted here after the same
 * ~20 lines were found duplicated identically across three sections.
 *
 * @param sectionName - Short label used in the log line, e.g. `'CategorySection'`.
 * @param fetchFn - The actual network call. Its return value is passed
 *   through unchanged on success.
 * @returns The fetched items, or `[]` on any failure (including a known
 *   backend outage). Callers own their own fallback/demo-data merge
 *   strategy — that differs per section (some replace wholesale, some pad
 *   up to a minimum count) and shouldn't be forced into one shape here.
 *
 * @example
 * const categories = await fetchHomepageSectionData('CategorySection', () =>
 *   productApi.getCategories()
 * );
 */
export async function fetchHomepageSectionData<T>(
  sectionName: string,
  fetchFn: () => Promise<T[]>
): Promise<T[]> {
  if (!(await isBackendAvailable())) {
    return [];
  }

  try {
    return await fetchFn();
  } catch (error) {
    const err = error as { status?: number; message?: string } | undefined;

    if (isBackendDown(error)) {
      logger.warn(`[${sectionName}] Backend unreachable. Using fallback data.`);
    } else if (err?.status === 401 || String(err?.message ?? '').includes('401')) {
      logger.warn(`[${sectionName}] Unauthorized (401). Using fallback data for guests.`);
    } else {
      logger.warn(`[${sectionName}] Failed to fetch data. Using fallback.`, {
        error: err?.message ?? String(error),
      });
    }

    return [];
  }
}

/**
 * Pads a list of live items with demo/fallback placeholders up to
 * `minCount`, skipping any placeholder whose id collides with a live item.
 *
 * Every placeholder is tagged `isDemo: true` so the UI can render a visible
 * indicator rather than presenting demo data as if it were live inventory —
 * see each section's "Preview" badge.
 *
 * @param items - Live items already fetched (possibly empty).
 * @param demoData - Static fallback/demo items, used only to fill the gap.
 * @param minCount - Desired minimum total length of the returned list.
 */
export function padWithDemoData<T extends { id: string | number }>(
  items: T[],
  demoData: T[],
  minCount: number
): Array<T & { isDemo?: boolean }> {
  if (items.length >= minCount) {
    return items;
  }

  const existingIds = new Set(items.map((item) => item.id));
  const placeholders = demoData
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({ ...item, isDemo: true as const }));

  return [...items, ...placeholders].slice(0, minCount);
}
