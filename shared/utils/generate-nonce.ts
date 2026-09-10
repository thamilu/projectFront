/**
 * generate-nonce.ts
 *
 * Cryptographically secure random nonce generator compatible with all JavaScript runtimes (Edge/Node).
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Safe base64 encoding without Node-only Buffer dependencies
  return btoa(String.fromCharCode(...Array.from(array)));
}
