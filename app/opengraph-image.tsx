/**
 * Open Graph share image.
 *
 * [GAP] `app/layout.tsx` declared `openGraph.images` and `twitter.images`
 * pointing at `/og-image.png`, which does not exist in `public/` — verified
 * live as a 404. Every link shared to WhatsApp, Slack, LinkedIn, X, iMessage or
 * a Discord embed therefore rendered with no image at all. For a commerce
 * platform whose growth depends on shared product and store links, that is a
 * silent, permanent conversion cost on every share.
 *
 * Generated at request time with `ImageResponse` rather than committed as a
 * binary. That choice is deliberate:
 *
 * - **It cannot drift from the brand.** Colours come from the same token values
 *   as the application, so a palette change updates the share image too. A
 *   committed PNG goes stale the moment the brand moves and nobody notices,
 *   because nobody looks at share images.
 * - **No binary in the repository**, so it is reviewable in a diff.
 * - **It composes.** A route can override this file to produce a per-entity
 *   image (a product's title and price, a store's name) by placing its own
 *   `opengraph-image.tsx` in that segment — the mechanism is identical.
 *
 * Next.js serves this at a stable URL and injects the correct `og:image` and
 * `twitter:image` tags automatically, which is why the hardcoded `images`
 * entries were removed from the root metadata.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 * @module app/opengraph-image
 */

import { ImageResponse } from 'next/og';
import { siteConfig } from '@/core/config/site';

/** Alt text for the generated image, used when the platform shows one. */
export const alt = `${siteConfig.name} — ${siteConfig.description}`;

/**
 * 1200×630 is the ratio every major platform crops toward (Facebook, LinkedIn,
 * X summary_large_image, Slack). Deviating means one of them letterboxes.
 */
export const size = { width: 1200, height: 630 };

export const contentType = 'image/png';

/**
 * Brand palette, mirrored from `app/styles/tokens.css`.
 *
 * Restated as literal hex rather than read from CSS because Satori — the
 * renderer behind `ImageResponse` — resolves neither CSS custom properties nor
 * an external stylesheet. Kept to the few values this image actually uses so
 * the duplication stays small and obvious; `--primitive-blue-600` is
 * `hsl(221 83% 53%)`, which is `#2563eb`.
 */
const BRAND = {
  /** --primitive-slate-950 */
  background: '#020617',
  /** --primitive-blue-600 → --color-primary */
  primary: '#2563eb',
  /** --primitive-slate-50 */
  foreground: '#f8fafc',
  /** --primitive-slate-400 */
  muted: '#94a3b8',
} as const;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: BRAND.background,
          // A single accent wash anchored to the brand colour. Kept subtle so
          // the wordmark stays the focal point at thumbnail size, which is how
          // most people actually see this.
          backgroundImage: `radial-gradient(circle at 85% 15%, ${BRAND.primary}33 0%, transparent 55%)`,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: BRAND.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '38px',
              fontWeight: 700,
              color: BRAND.foreground,
            }}
          >
            {/* First letter of the configured brand name — no asset needed. */}
            {siteConfig.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: BRAND.foreground }}>
            {siteConfig.name}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: '48px',
            fontSize: '68px',
            fontWeight: 700,
            color: BRAND.foreground,
            lineHeight: 1.1,
            // Bounded so a long configured description cannot overflow the
            // canvas — Satori does not clip, it overflows silently.
            maxWidth: '900px',
          }}
        >
          {truncate(siteConfig.description, 90)}
        </div>

        {/* Rule */}
        <div
          style={{
            marginTop: '48px',
            width: '120px',
            height: '6px',
            borderRadius: '3px',
            background: BRAND.primary,
          }}
        />

        {/* Domain */}
        <div style={{ marginTop: '32px', fontSize: '26px', color: BRAND.muted }}>
          {hostnameOf(siteConfig.url)}
        </div>
      </div>
    ),
    size
  );
}

/** Trim to a word boundary so the headline never ends mid-word. */
function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const clipped = value.slice(0, maxChars);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped}…`;
}

/**
 * Display host for the configured site URL.
 *
 * Falls back to the raw value rather than throwing: this image must render even
 * if the URL is malformed, since a broken share image is the exact failure this
 * file exists to remove.
 */
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
