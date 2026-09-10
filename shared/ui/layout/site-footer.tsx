/**
 * Site footer.
 *
 * [GAP] The application shipped without one. The root layout rendered a header
 * and `<main>` and nothing else, which meant:
 *
 * - `/terms`, `/privacy`, `/help`, `/about`, `/contact`, `/categories`,
 *   `/stores` and `/deals` all existed but were reachable only by typing the
 *   URL. For a commerce platform, policy and contact links are expected to be
 *   persistently reachable, so this was a compliance gap as much as a
 *   navigational one;
 * - the document had no `contentinfo` landmark, leaving the landmark structure
 *   incomplete for screen-reader users navigating by region.
 *
 * A server component by design: it is static, identical for every visitor, and
 * has no interactivity, so it costs zero client JavaScript.
 *
 * @module shared/ui/layout/site-footer
 */

import Link from 'next/link';
import { navigationConfig } from '@/core/config/navigation';
import { socialConfig } from '@/core/config/social';
import { siteConfig } from '@/core/config/site';

/**
 * Social links, projected from config into a renderable list.
 *
 * Derived rather than hand-listed so adding a network to `socialConfig` is the
 * only edit required. Labels are explicit because an icon-only or brand-only
 * link gives assistive technology nothing to announce.
 */
const SOCIAL_LINKS: ReadonlyArray<{ label: string; url: string }> = [
  { label: 'Twitter', url: socialConfig.twitter.url },
  { label: 'Facebook', url: socialConfig.facebook.url },
  { label: 'Instagram', url: socialConfig.instagram.url },
  { label: 'LinkedIn', url: socialConfig.linkedin.url },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      // The contentinfo landmark. Named, because a page may contain several
      // landmarks and "footer" alone does not distinguish them.
      aria-label="Site footer"
      className="bg-muted/30 border-border mt-auto border-t"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* ---------- Brand ---------- */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="focus-visible:ring-ring rounded text-lg font-bold focus-visible:ring-2 focus-visible:outline-none"
            >
              {siteConfig.name}
            </Link>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm">{siteConfig.description}</p>
          </div>

          {/* ---------- Link sections ---------- */}
          {navigationConfig.footer.map((section) => (
            <nav key={section.title} aria-labelledby={`footer-${slugify(section.title)}`}>
              {/*
                A real heading, associated with its nav via aria-labelledby, so
                screen-reader users get four distinctly-named navigation regions
                rather than four anonymous link lists.
              */}
              <h2
                id={`footer-${slugify(section.title)}`}
                className="text-foreground text-sm font-semibold"
              >
                {section.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ---------- Bottom bar ---------- */}
        <div className="border-border mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            © {year} {siteConfig.name}. All rights reserved.
          </p>

          <ul className="flex flex-wrap gap-4">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.url}
                  // `noopener` closes the reverse-tabnabbing vector on any
                  // target="_blank" link; `noreferrer` avoids leaking the
                  // originating URL to the destination.
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {social.label}
                  {/* Announces that activation leaves the site, which is not
                      otherwise conveyed to a screen-reader user. */}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** Stable id fragment from a section title, for aria-labelledby wiring. */
function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
