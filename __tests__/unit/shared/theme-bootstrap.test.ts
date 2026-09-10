/**
 * @jest-environment node
 *
 * Guards the theme bootstrap's CSP invariant.
 *
 * The blocking inline script is allow-listed by SHA-256 in
 * `shared/config/security-headers.ts`, because a nonce alone does not cover
 * statically-generated pages (`getCSPNonce()` has no request headers to read
 * during prerendering, so it returns `undefined`).
 *
 * That makes the hash a piece of duplicated state: a single changed byte in the
 * script — including whitespace — silently invalidates it, and the only symptom
 * in production would be a returning dark-mode flash plus a CSP violation
 * report per navigation. Nothing about that failure points at this file, which
 * is exactly why it is pinned by a test rather than left to review.
 */

import { createHash } from 'node:crypto';
import {
  THEME_BOOTSTRAP_SCRIPT,
  THEME_BOOTSTRAP_SCRIPT_HASH,
  THEME_STORAGE_KEY,
  buildThemeBootstrapScript,
} from '@/shared/theme/theme-bootstrap';

/** Compute the CSP source expression for a script body. */
function cspHashOf(source: string): string {
  return `sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}`;
}

describe('theme bootstrap', () => {
  it('has a pinned hash matching the script byte for byte', () => {
    const actual = cspHashOf(THEME_BOOTSTRAP_SCRIPT);

    // The failure message carries the correct value, so fixing a legitimate
    // script edit is a copy-paste rather than an investigation.
    expect(actual).toBe(THEME_BOOTSTRAP_SCRIPT_HASH);
  });

  it('references the same storage key the next-themes provider writes', () => {
    // The provider imports THEME_STORAGE_KEY rather than repeating the string.
    // If the script's embedded literal drifted from it, the bootstrap would
    // read a key nothing writes and stop preventing the flash — with no error.
    expect(THEME_BOOTSTRAP_SCRIPT).toContain(`"${THEME_STORAGE_KEY}"`);
  });

  it('clears the opposite theme class before applying the resolved one', () => {
    // The previous inline version only ever called classList.add, so a stale
    // class surviving a back/forward-cache restore left both applied.
    expect(THEME_BOOTSTRAP_SCRIPT).toContain("classList.remove('light','dark')");
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('classList.add(resolved)');
  });

  it('sets colorScheme so native controls match the theme', () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('root.style.colorScheme=resolved');
  });

  it('cannot throw, since localStorage raises outright in some privacy modes', () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('try{');
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('catch(e){}');
  });

  it('exposes the same source through the named accessor', () => {
    expect(buildThemeBootstrapScript()).toBe(THEME_BOOTSTRAP_SCRIPT);
  });

  describe('behaviour', () => {
    /** Execute the bootstrap against a minimal DOM stand-in. */
    function run(options: { stored: string | null; prefersDark: boolean }) {
      const classes = new Set<string>();
      const root = {
        classList: {
          add: (...names: string[]) => names.forEach((n) => classes.add(n)),
          remove: (...names: string[]) => names.forEach((n) => classes.delete(n)),
        },
        style: { colorScheme: '' },
      };

      const scope = {
        localStorage: { getItem: () => options.stored },
        window: { matchMedia: () => ({ matches: options.prefersDark }) },
        document: { documentElement: root },
      };

      // eslint-disable-next-line no-new-func
      new Function(
        'localStorage',
        'window',
        'document',
        THEME_BOOTSTRAP_SCRIPT
      )(scope.localStorage, scope.window, scope.document);

      return { classes, colorScheme: root.style.colorScheme };
    }

    it.each([
      { stored: 'dark', prefersDark: false, expected: 'dark' },
      { stored: 'light', prefersDark: true, expected: 'light' },
      { stored: 'system', prefersDark: true, expected: 'dark' },
      { stored: 'system', prefersDark: false, expected: 'light' },
      { stored: null, prefersDark: true, expected: 'dark' },
      { stored: null, prefersDark: false, expected: 'light' },
    ])(
      'resolves stored=$stored prefersDark=$prefersDark to $expected',
      ({ stored, prefersDark, expected }) => {
        const { classes, colorScheme } = run({ stored, prefersDark });

        expect(Array.from(classes)).toEqual([expected]);
        expect(colorScheme).toBe(expected);
      }
    );

    it('applies exactly one theme class, never both', () => {
      const { classes } = run({ stored: 'dark', prefersDark: false });
      expect(classes.size).toBe(1);
    });
  });
});
