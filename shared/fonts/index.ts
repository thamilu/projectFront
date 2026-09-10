/**
 * Font Configuration
 *
 * Centralized font loading configuration.
 * Uses Next.js font optimization for automatic subsetting and preloading.
 *
 * Decisions and rationales are documented in:
 * /docs/adr/0004-font-loading-strategy.md
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Internationalization (i18n) Font Strategy Reference
 * ─────────────────────────────────────────────────────────────────────────────
 * To support multi-script systems (CJK, Arabic, Cyrillic, Indic, etc.) in the future:
 * 1. Explicit Subsetting: Leverage next/font/google subsets config block:
 *    subsets: ['latin', 'latin-ext', 'cyrillic', 'greek']
 * 2. Dynamic Unicode-Range mapping: Define custom @font-face blocks mapping to
 *    system fonts or dynamically-loaded regional fonts (e.g., Noto Sans CJK/Arabic)
 *    associated with `--font-sans` variables.
 * 3. Script-Specific Fallbacks: Prepend localized fallback fonts (e.g., 'Hiragino Kaku Gothic ProN',
 *    'Microsoft YaHei', 'PingFang SC', 'Segoe UI Arabic') before the generic fallbacks.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * @module shared/fonts
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 */

import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Config } from 'tailwindcss';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical Fallback Font Stacks (Single Source of Truth)
// ─────────────────────────────────────────────────────────────────────────────

const SANS_FALLBACKS = [
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
] as const;

const MONO_FALLBACKS = [
  'ui-monospace',
  'SFMono-Regular',
  'Menlo',
  'Monaco',
  'Consolas',
  'Liberation Mono',
  'Courier New',
  'monospace',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Font Definitions
// Next.js compiler requires explicit string/array literals in these calls.
// Spreads or variable references (e.g. `fallback: [...SANS_FALLBACKS]`) are not
// supported by Next.js static AST parser and will cause compile errors.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary sans-serif font — Inter
 */
export const fontSans = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  weight: ['400', '500', '600', '700'],
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  adjustFontFallback: true,
});

/**
 * Monospace font — JetBrains Mono
 */
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  weight: ['400', '700'],
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
  adjustFontFallback: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Constants — Derived from Single Source of Truth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CSS Custom Property names for font families.
 */
export const FONT_CSS_VARIABLES = {
  sans: fontSans.variable as '--font-sans',
  mono: fontMono.variable as '--font-mono',
} as const;

/** Discriminated union of valid font CSS variable names */
export type FontCSSVariable = (typeof FONT_CSS_VARIABLES)[keyof typeof FONT_CSS_VARIABLES];

/**
 * System font fallback stacks for progressive enhancement.
 */
export const FONT_FALLBACKS = {
  sans: SANS_FALLBACKS,
  mono: MONO_FALLBACKS,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Drift Detection & Development assertions (Pure Functions)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that font loader fallbacks match the canonical fallback constants.
 * Runs in development only to warn developers of fallback config mismatches.
 * Exported (not just used internally by validateFonts) so its comparison
 * logic is directly testable without needing to re-mock next/font/google.
 */
export function validateFallbackParity(
  fontFamilyString: string,
  canonicalFallbacks: readonly string[],
  fontName: string
): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  try {
    const resolvedFamilies = fontFamilyString
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));

    // next/font always prepends entries ahead of the user-supplied `fallback`
    // array — the real font's own name (e.g. "Inter") and, when
    // adjustFontFallback is on, an auto-generated metric-adjusted fallback
    // face (e.g. "__Inter_Fallback_abc123"). Neither is part of what this
    // function is checking, and their exact count/naming isn't something to
    // predict — it varies by next/font version and is invisible from here.
    // Only the trailing slice matching canonicalFallbacks' length is the
    // actual fallback stack, so compare that instead of trying to filter out
    // every possible prefixed-entry shape.
    const actualFallbacks = resolvedFamilies.slice(-canonicalFallbacks.length);

    const loaderStr = actualFallbacks.join(',');
    const canonicalStr = canonicalFallbacks.join(',');

    if (loaderStr !== canonicalStr) {
      console.warn(
        `[FontConfig] Fallback mismatch detected for "${fontName}".\n` +
          `Loader resolved fallbacks: ${JSON.stringify(actualFallbacks)}\n` +
          `Canonical fallbacks:       ${JSON.stringify(canonicalFallbacks)}\n` +
          `Update canonical fallbacks in /shared/fonts/index.ts to match the font loader definition.`
      );
    }
  } catch (err) {
    console.warn(
      `[FontConfig] Unexpected error occurred during fallback verification for "${fontName}":`,
      err
    );
  }
}

/**
 * Validates font fallbacks parity. Should be called during layout mount in development.
 * This function is pure and avoids side effects during module initialization.
 */
export function validateFonts(): void {
  if (process.env.NODE_ENV === 'development') {
    validateFallbackParity(fontSans.style.fontFamily, FONT_FALLBACKS.sans, 'Inter');
    validateFallbackParity(fontMono.style.fontFamily, FONT_FALLBACKS.mono, 'JetBrains Mono');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composed Utilities — Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Combined className string for the <html> element.
 */
export const fontClassNames = `${fontSans.variable} ${fontMono.variable}`;

type FontFamilyConfig = NonNullable<NonNullable<Config['theme']>['fontFamily']>;

/**
 * Tailwind CSS fontFamily configuration.
 */
export const tailwindFontConfig = {
  sans: [`var(${FONT_CSS_VARIABLES.sans})`, ...FONT_FALLBACKS.sans],
  mono: [`var(${FONT_CSS_VARIABLES.mono})`, ...FONT_FALLBACKS.mono],
} as const satisfies Partial<FontFamilyConfig>;
