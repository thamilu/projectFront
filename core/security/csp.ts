/**
 * CSP nonce access.
 *
 * The nonce is minted per request by `proxy.ts` and forwarded on the
 * `x-csp-nonce` request header, so it is available only during request-time
 * rendering.
 *
 * @module core/security/csp
 */

import { headers } from 'next/headers';
import { logger } from '@/core/telemetry/logger';

/** Header `proxy.ts` uses to forward the per-request nonce. */
const NONCE_HEADER = 'x-csp-nonce';

/**
 * Retrieve the per-request CSP nonce, or `undefined` when there is none.
 *
 * **`undefined` is a normal result, not a failure.** During static generation
 * Next.js renders each route without a request context, and `headers()` throws
 * a `DynamicServerError` to signal that the route cannot be prerendered. The
 * previous implementation caught that and wrote it to `console.error`, which
 * produced a wall of red "[Security] Failed to retrieve CSP nonce" lines on
 * every single build — one per candidate route — for entirely expected
 * behaviour. Noise like that is actively harmful: it trains everyone reading
 * build output to ignore a line that begins "[Security]".
 *
 * The expected case is now silent. A genuinely unexpected failure still logs,
 * at `warn`, through the structured logger.
 *
 * Callers must tolerate `undefined`. Inline scripts that need to run on
 * statically-generated pages are allow-listed by hash instead — see
 * `shared/theme/theme-bootstrap.ts`.
 */
export async function getCSPNonce(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get(NONCE_HEADER) || undefined;
  } catch (error) {
    // `DynamicServerError` is Next.js's static-render probe, not a fault.
    // Matched on the name rather than by importing the class, which lives in a
    // Next internal path with no stable public export.
    if (isStaticRenderProbe(error)) {
      return undefined;
    }

    logger.warn('[Security] Could not read the CSP nonce header', {
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

/** True when the throw is Next.js signalling "this route cannot be static". */
function isStaticRenderProbe(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'DynamicServerError' ||
    // Older/edge builds surface the same condition with a plain Error whose
    // message carries this marker.
    error.message.includes('Dynamic server usage')
  );
}
