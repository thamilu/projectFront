/**
 * Blocking theme bootstrap injected into `<head>`.
 *
 * Runs before first paint so the correct theme class is on `<html>` when the
 * browser paints, eliminating the light-then-dark flash. It is deliberately a
 * blocking inline script: a deferred or external script paints first and
 * corrects afterwards, which is the flash it exists to prevent.
 *
 * ## Why this is allowed by CSP via a hash, not only a nonce
 *
 * `proxy.ts` serves `script-src 'self' 'nonce-<n>' 'strict-dynamic'`, and the
 * root layout does pass that nonce. But a nonce is only available for
 * request-time rendering: during static generation `getCSPNonce()` reads
 * `headers()`, which is unavailable, so it returns `undefined` and the
 * prerendered HTML carries no nonce. `/products/[slug]` is prerendered
 * (`generateStaticParams`), so a nonce alone would leave this script blocked on
 * exactly those pages — reinstating the flash and filing a CSP violation report
 * per navigation.
 *
 * Because the script is a compile-time constant with no interpolated values,
 * its SHA-256 is stable and can be allow-listed directly. Under CSP Level 3,
 * `'strict-dynamic'` ignores host expressions but still honours nonces *and*
 * hashes, so the hash covers both the static and the dynamic case. The nonce is
 * still emitted as well, which is harmless and keeps the element consistent
 * with the rest of the document.
 *
 * [INVARIANT] {@link THEME_BOOTSTRAP_SCRIPT} and
 * {@link THEME_BOOTSTRAP_SCRIPT_HASH} must stay in lockstep. A single changed
 * byte — including whitespace — invalidates the hash and blocks the script.
 * `__tests__/unit/shared/theme-bootstrap.test.ts` recomputes the digest and
 * fails if they diverge, so this cannot drift silently. The hash is a literal
 * rather than computed at runtime because `buildCsp` executes in the Edge
 * runtime, where the only digest API is asynchronous and cannot be used from a
 * synchronous module constant.
 *
 * @module shared/theme/theme-bootstrap
 */

/**
 * localStorage key holding the user's theme preference.
 *
 * Must match the `storageKey` given to `next-themes` in
 * `core/providers/provider-registry.tsx`, which imports this constant rather
 * than repeating the literal. If the two ever diverged, the bootstrap would
 * read a key nothing writes and silently stop preventing the flash.
 */
export const THEME_STORAGE_KEY = 'eshop-theme';

/** Class names applied to `<html>`. Kept aligned with `globals.css`. */
export const THEME_CLASS_NAMES = ['light', 'dark'] as const;

export type ThemeName = (typeof THEME_CLASS_NAMES)[number];

/**
 * The bootstrap source, verbatim.
 *
 * Behavioural notes, each addressing a defect in the previous inline version:
 *
 * - It **removes** the opposite class before adding the resolved one. The old
 *   script only ever called `classList.add`, so a stale class surviving a
 *   back/forward-cache restore was never cleared and both could be present.
 * - It sets `colorScheme` on the root element, so native form controls,
 *   scrollbars and date pickers match the theme rather than rendering in the
 *   OS default.
 * - It resolves `'system'` and an absent preference identically, matching
 *   `next-themes`' own default so the two cannot disagree on first paint.
 *
 * The body is wrapped in try/catch because `localStorage` throws outright in
 * some privacy modes, and a theme preference is never worth breaking the
 * document over.
 *
 * Written as a literal — not assembled from `THEME_STORAGE_KEY` — so the bytes
 * hashed below are exactly the bytes served. Interpolation would make the
 * content depend on evaluation order and defeat a compile-time digest.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var k="eshop-theme";
var stored=localStorage.getItem(k);
var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
var resolved=(!stored||stored==='system')?(prefersDark?'dark':'light'):stored;
var root=document.documentElement;
root.classList.remove('light','dark');
root.classList.add(resolved);
root.style.colorScheme=resolved;
}catch(e){}})();`;

/**
 * CSP `script-src` source expression for {@link THEME_BOOTSTRAP_SCRIPT}.
 *
 * Regenerate with:
 * `node -e "const{createHash}=require('crypto');console.log('sha256-'+createHash('sha256').update(SCRIPT,'utf8').digest('base64'))"`
 * — or simply run the theme-bootstrap test, whose failure message reports the
 * expected value.
 */
export const THEME_BOOTSTRAP_SCRIPT_HASH = 'sha256-3bpWxjtka9w3kzAk0nhFWzfCNcTPcr3URCQhsf+hWMo=';

/**
 * @returns The bootstrap source.
 * @deprecated Prefer {@link THEME_BOOTSTRAP_SCRIPT} directly. Retained as a
 * named accessor for call sites that read better as a function.
 */
export function buildThemeBootstrapScript(): string {
  return THEME_BOOTSTRAP_SCRIPT;
}
