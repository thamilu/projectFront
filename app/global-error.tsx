'use client';

/**
 * Global error boundary.
 *
 * The last line of defence: it catches failures in the root layout itself, so
 * it must render its own `<html>` and `<body>` and cannot rely on any provider,
 * theme context or shared layout having initialised.
 *
 * Three defects are fixed here:
 *
 * 1. **`<html>` had no `lang`.** Screen readers fall back to the user agent's
 *    language and may pronounce the page with the wrong phoneme set —
 *    WCAG 3.1.1, on the page a user is most likely to be confused by.
 *
 * 2. **It never reported to Sentry.** It called `logger.error` only, so the
 *    single most severe class of failure — one that broke the root layout — was
 *    the one class the error tracker never received.
 *
 * 3. **It relied on design tokens that may not exist here.** This boundary can
 *    render when the stylesheet or the theme provider has failed, so the
 *    critical styling is now inlined rather than assumed. That is a deliberate
 *    exception to the token rule applied everywhere else, not an oversight.
 *
 * @module app/global-error
 */

import { useEffect } from 'react';
import { captureException } from '@sentry/nextjs';
import { logger } from '@/core/telemetry/logger';

/**
 * Minimal inline styling.
 *
 * Uses `color-scheme` plus `light-dark()`-free CSS variables so the page is
 * legible in either OS theme without depending on the app's stylesheet having
 * loaded. Everything the user needs to read is styled without a single class
 * name from the design system.
 */
const CRITICAL_CSS = `
  :root { color-scheme: light dark; --ge-bg: #ffffff; --ge-fg: #0f1619; --ge-muted: #5a6572; --ge-accent: #1b4d5e; --ge-border: #d5dbe1; }
  @media (prefers-color-scheme: dark) {
    :root { --ge-bg: #0d1315; --ge-fg: #e4ebed; --ge-muted: #93a4ac; --ge-accent: #6fb6c9; --ge-border: #263539; }
  }
  .ge-body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem;
    background: var(--ge-bg); color: var(--ge-fg);
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; line-height: 1.6; }
  .ge-card { max-width: 28rem; width: 100%; text-align: center; }
  .ge-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem; }
  .ge-text { color: var(--ge-muted); margin: 0 0 1.5rem; }
  .ge-actions { display: flex; flex-direction: column; gap: 0.5rem; }
  .ge-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.6rem 1rem;
    border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; cursor: pointer;
    border: 1px solid var(--ge-border); background: transparent; color: inherit; font-family: inherit; }
  .ge-btn-primary { background: var(--ge-accent); border-color: var(--ge-accent); color: var(--ge-bg); }
  .ge-btn:focus-visible { outline: 2px solid var(--ge-accent); outline-offset: 2px; }
  .ge-ref { color: var(--ge-muted); font-size: 0.75rem; margin-top: 1.5rem; }
  .ge-ref code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global error boundary triggered', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });

    // Reported at `fatal`: reaching this boundary means the root layout itself
    // failed, so the whole application is unusable for this user.
    captureException(error, {
      level: 'fatal',
      tags: { boundary: 'global', digest: error.digest ?? 'none' },
    });
  }, [error]);

  return (
    // `lang` is mandatory — this element replaces the root layout's <html>,
    // so omitting it drops the document's language declaration entirely.
    <html lang="en" dir="ltr">
      <head>
        <title>Something went wrong</title>
        <meta name="robots" content="noindex" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body className="ge-body">
        <div className="ge-card">
          <h1 className="ge-title" role="alert">
            Something went wrong
          </h1>
          <p className="ge-text">
            A critical error stopped the page from loading. We&apos;ve been notified and are looking
            into it.
          </p>

          <div className="ge-actions">
            <button type="button" className="ge-btn ge-btn-primary" onClick={() => reset()}>
              Try again
            </button>
            {/*
              A plain anchor, not next/link: the router may be part of what
              failed, so a full document load is the reliable escape hatch.
            */}
            <a className="ge-btn" href="/">
              Back to home
            </a>
          </div>

          {error.digest && (
            <p className="ge-ref">
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
