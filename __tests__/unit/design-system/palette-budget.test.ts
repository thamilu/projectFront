/**
 * Ratchet on raw Tailwind palette usage.
 *
 * The design system defines a full semantic token set — `primary`,
 * `destructive`, `success`, `warning`, `info`, `muted`, `border`, and now
 * `seller-accent` — with contrast documented per theme, including
 * high-contrast and colour-blind variants. Roughly **2,200 class usages bypass
 * it** and hardcode a raw palette value instead (`text-slate-500`,
 * `bg-indigo-600`, `border-gray-200`).
 *
 * Each one is invisible to theming. Several were provably broken:
 * `text-slate-500 dark:text-slate-500` set the same value for both themes;
 * `bg-green-100 text-green-700` had no dark variant at all and rendered
 * pale-on-pale; the seller registration page mixed `text-indigo-600` icons with
 * `bg-primary` buttons, showing two competing brand blues on one screen.
 *
 * ## Why a budget rather than a sweep
 *
 * Mechanically replacing 2,200 class usages across screens nobody has visually
 * reviewed is how a refactor breaks a design. Several of these surfaces are
 * deliberately dark-only and use hardcoded slate backgrounds; swapping them for
 * theme-reactive tokens changes how they render, and that needs a designer's
 * eye, not a regex.
 *
 * So this file does the thing that is safe and still effective: it **stops the
 * number growing**. New code must use tokens. Existing debt is visible,
 * counted, and can be paid down deliberately, one reviewed surface at a time —
 * lowering `BUDGET` as it goes.
 *
 * A failure here is not "your code is wrong". It is "you added a raw palette
 * class where a token exists; use the token, or lower the budget if you removed
 * some".
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = join(__dirname, '..', '..', '..');

/** Directories whose styling is owned by the design system. */
const SCANNED_DIRS = ['app', 'features', 'shared'] as const;

/**
 * Current ceiling: 2,196 raw palette class usages in **code** (comments are
 * stripped before counting — see `stripComments`).
 *
 * Lower it whenever a surface is migrated; never raise it. If a change needs
 * this raised, the change is what to reconsider.
 */
const BUDGET = 2196;

/** Tailwind's built-in palette names — the ones a token should replace. */
const PALETTE = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
] as const;

/** Utilities where a colour choice is being made. */
const UTILITIES = ['bg', 'text', 'border', 'ring', 'from', 'to', 'via'] as const;

const PALETTE_CLASS = new RegExp(
  `\\b(?:${UTILITIES.join('|')})-(?:${PALETTE.join('|')})-\\d{2,3}\\b`,
  'g'
);

function tsxFiles(): string[] {
  const found: string[] = [];

  const walk = (relativeDir: string): void => {
    for (const entry of readdirSync(join(PROJECT_ROOT, relativeDir), { withFileTypes: true })) {
      const relativePath = relativeDir + '/' + entry.name;
      if (entry.isDirectory()) {
        walk(relativePath);
      } else if (entry.name.endsWith('.tsx')) {
        found.push(relativePath);
      }
    }
  };

  for (const dir of SCANNED_DIRS) walk(dir);
  return found;
}

/**
 * Strip comments before counting.
 *
 * Without this the metric counts its own documentation: a comment explaining
 * *why* `bg-slate-950` was moved off a section registers as a `bg-slate-950`
 * usage, so documenting a migration makes the number go up. That inverts the
 * incentive — it would penalise exactly the explanatory comments this codebase
 * wants. Caught when this test failed on a change that was net-zero in code.
 *
 * The `//` rule ignores a match preceded by `:` so protocol-relative URLs
 * (`https://…`) inside string literals are not mistaken for line comments.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '') // block and {/* JSX */} comments
    .replace(/(^|[^:])\/\/.*$/gm, '$1'); // line comments, sparing URLs
}

/** Count raw palette classes per file, heaviest first. */
function countByFile(): Array<{ file: string; count: number }> {
  return tsxFiles()
    .map((file) => ({
      file,
      count: (stripComments(readFileSync(join(PROJECT_ROOT, file), 'utf8')).match(PALETTE_CLASS) ?? [])
        .length,
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);
}

describe('design system: raw palette budget', () => {
  it(`stays at or below ${BUDGET} raw palette class usages`, () => {
    const byFile = countByFile();
    const total = byFile.reduce((sum, entry) => sum + entry.count, 0);

    if (total > BUDGET) {
      // Name the worst offenders, so a failure points somewhere actionable
      // instead of just reporting a number.
      const worst = byFile
        .slice(0, 10)
        .map(({ file, count }) => `  ${String(count).padStart(4)}  ${file}`)
        .join('\n');

      throw new Error(
        `Raw palette usage rose to ${total}, above the budget of ${BUDGET}.\n\n` +
          'Use a semantic token instead of a hardcoded palette value:\n' +
          '  text-slate-900  → text-foreground\n' +
          '  text-slate-500  → text-muted-foreground\n' +
          '  bg-white        → bg-card  /  bg-background\n' +
          '  text-red-500    → text-destructive\n' +
          '  text-green-600  → text-success\n' +
          '  bg-indigo-600   → bg-seller-accent   (seller console only)\n\n' +
          `Heaviest files:\n${worst}\n`
      );
    }

    expect(total).toBeLessThanOrEqual(BUDGET);
  });

  it('keeps the budget honest — it must track reality, not sit far above it', () => {
    const total = countByFile().reduce((sum, entry) => sum + entry.count, 0);

    // A budget left far above the real count silently permits regression. If
    // migration drops the number, this fails and prompts lowering BUDGET,
    // locking the improvement in.
    expect(BUDGET - total).toBeLessThanOrEqual(50);
  });

  it('exposes a seller-accent token so the console has a legitimate alternative', () => {
    const tokens = readFileSync(join(PROJECT_ROOT, 'app/styles/tokens.css'), 'utf8');

    // Defined for both themes and published to Tailwind, or `bg-seller-accent`
    // silently generates nothing — the failure mode that would make the
    // suggested migration above produce invisible elements.
    expect(tokens).toContain('--color-seller-accent: var(--primitive-indigo-600)');
    expect(tokens).toContain('--color-seller-accent: var(--primitive-indigo-400)');
    expect(tokens).toContain('--color-seller-accent: hsl(var(--color-seller-accent))');
  });
});
