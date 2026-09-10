/**
 * @module shared/utils/share
 * @description
 * Reusable "share this link" helper — Web Share API when the platform
 * supports it (mobile browsers, most modern desktop browsers), falling back
 * to copying the link to the clipboard otherwise. Callers own the toast on
 * the clipboard-fallback path since the message is usually contextual (e.g.
 * "Product link copied", "Wishlist link copied").
 */

/**
 * Attempts a native share sheet for `url`, falling back to the clipboard.
 *
 * @returns 'shared' if the native share sheet was used and completed,
 *          'copied' if the URL was written to the clipboard instead,
 *          'cancelled' if the user dismissed the native share sheet,
 *          'failed' if neither mechanism is available/succeeded.
 */
export async function shareUrl(
  title: string,
  url: string,
  text?: string
): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      // AbortError: the user closed the share sheet without picking a
      // target — respect that instead of falling through to clipboard.
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
      // Any other failure (e.g. share() unsupported for this payload on
      // this platform) falls through to the clipboard fallback below.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}
