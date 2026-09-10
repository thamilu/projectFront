/**
 * Horizontal rhythm across page sections.
 *
 * A page's sections must share one content edge. When they do not, the layout
 * reads as broken even though nothing is technically overflowing — headings and
 * cards step in and out as you scroll.
 *
 * ## The bug this guards against
 *
 * `app/globals.css`'s `@utility container` declared its responsive
 * `padding-inline` using five custom properties that **did not exist** —
 * `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`, `--space-3xl`. The
 * design system's spacing scale is numeric (`--space-1` … `--space-44`), so
 * every one of those declarations was invalid and silently dropped. There were
 * no fallbacks, so nothing failed loudly; `max-width` kept working because it
 * used literals.
 *
 * The result, measured on the live homepage at a 1536px viewport: content edges
 * of **48px, 24px and 0px** on the same page, and grids running to 1474px wide
 * because `max-width` was never reached. Sections then compensated with their
 * own `px-4 md:px-6`, which capped padding at 24px and diverged further from
 * sections that did not.
 *
 * These assertions measure the rendered result rather than the class names,
 * because the class names looked correct the whole time.
 */

import { test, expect, type Page } from '@playwright/test';

/** Viewports spanning every container breakpoint. */
const VIEWPORTS = [
  { width: 1536, height: 900, label: '2xl' },
  { width: 1280, height: 900, label: 'xl' },
  { width: 1100, height: 900, label: 'lg' },
  { width: 800, height: 900, label: 'md' },
  { width: 700, height: 900, label: 'sm' },
  { width: 390, height: 844, label: 'mobile' },
  // 320px is the narrowest viewport still in real use (iPhone SE 1st gen,
  // older Android). The header overflowed here by 15px until the brand and
  // action blocks were measured at 350px inside a 320px viewport.
  { width: 320, height: 800, label: 'tiny' },
] as const;

/** Load the homepage and resolve every streamed section. */
async function loadFully(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 130));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
}

/**
 * Left content edge of each section that has a `.container`.
 *
 * Sections whose first child is a decorative full-bleed layer (an
 * `absolute inset-0` backdrop) are excluded — those are meant to reach the
 * viewport edge and are not content.
 */
async function contentEdges(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('section'))
      .map((section) => section.querySelector(':scope > div.container'))
      .filter((el): el is HTMLElement => el instanceof HTMLElement)
      .map((container) => {
        const style = getComputedStyle(container);
        return Math.round(container.getBoundingClientRect().left + parseFloat(style.paddingLeft));
      })
  );
}

test.describe('Homepage horizontal rhythm', () => {
  for (const viewport of VIEWPORTS) {
    test(`sections share one content edge at ${viewport.label} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadFully(page);

      const edges = await contentEdges(page);
      test.skip(edges.length < 2, 'Fewer than two sections rendered.');

      // Sub-pixel rounding can differ by 1px between elements; anything beyond
      // that is a real misalignment a reader will notice.
      const spread = Math.max(...edges) - Math.min(...edges);
      expect(spread, `content edges: ${JSON.stringify([...new Set(edges)])}`).toBeLessThanOrEqual(1);
    });
  }

  // One test per viewport rather than a loop inside a single test: six full
  // page loads exceed the default timeout, and a failure should name the
  // viewport it happened at rather than just "overflow somewhere".
  for (const viewport of VIEWPORTS) {
    test(`never scrolls horizontally at ${viewport.label} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadFully(page);

      // A container whose padding silently vanished is a common cause of a page
      // that scrolls sideways on mobile.
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflows).toBe(false);
    });
  }

  test('container padding scales with viewport', async ({ page }) => {
    // The specific regression: padding was frozen because its tokens did not
    // resolve. Padding at the widest breakpoint must exceed padding at the
    // narrowest, or the responsive scale is dead again.
    await page.setViewportSize({ width: 390, height: 844 });
    await loadFully(page);
    const narrow = await page.evaluate(() => {
      const c = document.querySelector('section > div.container');
      return c ? parseFloat(getComputedStyle(c).paddingLeft) : null;
    });

    await page.setViewportSize({ width: 1536, height: 900 });
    await loadFully(page);
    const wide = await page.evaluate(() => {
      const c = document.querySelector('section > div.container');
      return c ? parseFloat(getComputedStyle(c).paddingLeft) : null;
    });

    test.skip(narrow === null || wide === null, 'No section container found.');
    expect(wide as number).toBeGreaterThan(narrow as number);
  });
});
