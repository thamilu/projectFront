/**
 * X / Twitter share image.
 *
 * Re-exports the Open Graph image rather than defining a second one. The
 * `summary_large_image` card uses the same 1200×630 ratio, so a separate
 * design would be two things to keep in sync for no visible difference — and
 * the pair drifting apart is the predictable outcome.
 *
 * Next.js requires a distinct file for the `twitter:image` tag to be emitted,
 * so this thin re-export is the mechanism, not duplication.
 *
 * @module app/twitter-image
 */

export { default, alt, size, contentType } from './opengraph-image';
