/**
 * Shop handle rules — the single source of truth.
 *
 * A shop handle is the public URL segment for a seller's storefront
 * (`eshop.com/shop/<handle>`). Three separate places used to encode its rules,
 * and they did not agree:
 *
 * | Location                              | Accepted                    |
 * | ------------------------------------- | --------------------------- |
 * | `seller.schema.ts` (twice, verbatim)  | `^[a-z0-9-]+$`, 3–50        |
 * | `path-safety.ts` `validateHandle`     | `^[a-zA-Z0-9_-]{3,50}$`     |
 *
 * The divergence was not cosmetic. `validateHandle` runs inside
 * `API_ENDPOINTS.SELLER.CHECK_HANDLE()` and **throws** a `PathSegmentError` for
 * anything it rejects. Because it is looser than the schema it never fired on
 * schema-valid input — but it did fire on in-progress typing (`my.shop`,
 * `My Shop`) and on auto-generated handles longer than 50 characters, throwing
 * synchronously into an availability-check `catch` block that assumed every
 * error was an HTTP failure. The seller was told "Handle verification failed"
 * when the real answer was "that format isn't allowed".
 *
 * Stating the rules once, here, means the form, the availability check, and the
 * URL builder can never drift apart again.
 *
 * @module domains/seller/contracts/shop-handle
 */

/** Shortest handle the backend will accept. */
export const SHOP_HANDLE_MIN_LENGTH = 3;

/** Longest handle the backend will accept. */
export const SHOP_HANDLE_MAX_LENGTH = 50;

/**
 * Permitted characters: lowercase letters, digits and hyphens.
 *
 * Deliberately narrower than a generic URL segment. Handles are shown to
 * shoppers and typed by hand, so mixed case (`MyShop` vs `myshop` resolving
 * differently) and underscores (invisible under a link underline) are excluded.
 */
export const SHOP_HANDLE_PATTERN = /^[a-z0-9-]+$/;

/** Field-level copy, kept beside the rules so the two cannot drift. */
export const SHOP_HANDLE_MESSAGES = {
  tooShort: `Handle must be at least ${SHOP_HANDLE_MIN_LENGTH} characters`,
  tooLong: `Handle cannot exceed ${SHOP_HANDLE_MAX_LENGTH} characters`,
  invalidCharacters: 'Only lowercase letters, numbers, and hyphens allowed',
} as const;

/**
 * Explain why a handle is unacceptable, or `null` when it is fine.
 *
 * Returning the reason rather than a bare boolean is what lets the availability
 * check tell a seller *what* to change instead of showing a generic failure.
 *
 * @param handle Raw field value, exactly as typed.
 * @returns A user-facing message, or `null` if the handle is well-formed.
 */
export function describeShopHandleViolation(handle: string): string | null {
  if (handle.length < SHOP_HANDLE_MIN_LENGTH) return SHOP_HANDLE_MESSAGES.tooShort;
  if (handle.length > SHOP_HANDLE_MAX_LENGTH) return SHOP_HANDLE_MESSAGES.tooLong;
  if (!SHOP_HANDLE_PATTERN.test(handle)) return SHOP_HANDLE_MESSAGES.invalidCharacters;
  return null;
}

/** True when `handle` satisfies every rule above. */
export function isValidShopHandle(handle: string): boolean {
  return describeShopHandleViolation(handle) === null;
}

/**
 * Derive a well-formed handle from a store name.
 *
 * Guarantees the result is either empty or valid, so the suggestion a seller is
 * handed can never be one the form immediately rejects. The previous inline
 * version omitted the length cap: a 60-character store name produced a
 * 60-character handle that failed `max(50)` validation *and* crashed the
 * availability check, with the seller having typed nothing wrong.
 *
 * Trailing hyphens are stripped **after** truncation — slicing at 50 can land
 * mid-word and leave a dangling separator (`my-long-store-`).
 *
 * @param storeName Free-text store name.
 * @returns A valid handle, or `''` when the name yields nothing usable.
 */
export function generateShopHandle(storeName: string): string {
  const slug = storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SHOP_HANDLE_MAX_LENGTH)
    .replace(/-+$/g, '');

  // Below the minimum it is not a handle, it is a fragment. Returning '' keeps
  // the "no suggestion yet" state honest rather than seeding an invalid value.
  return slug.length >= SHOP_HANDLE_MIN_LENGTH ? slug : '';
}
