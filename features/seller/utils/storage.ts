const SELLER_PENDING_STORAGE_KEY = 'seller_onboarding_pending';

/**
 * Form field names that must NEVER be written to localStorage as part of the
 * onboarding draft autosave/save-and-exit flow.
 *
 * SECURITY: the autosave feature previously JSON.stringify'd the ENTIRE form
 * (via react-hook-form's getValues()) straight into localStorage every
 * second while the user typed — including government ID numbers and bank
 * account details — in plaintext, with no encryption and no TTL beyond an
 * explicit "start fresh" action. That data is then readable by any XSS on
 * the origin, or by anyone with access to the device/browser profile, for
 * as long as the draft key exists (which could be indefinitely, since the
 * only way a saved draft would be missing after a completed submission is
 * if it's explicitly cleared). Drafts should only ever persist non-sensitive
 * step progress — the user simply re-enters KYC/bank details if they resume.
 */
const SENSITIVE_ONBOARDING_FIELDS = [
  'panNumber',
  'aadhar',
  'gstin',
  'businessPan',
  'bankAccountNumber',
  'bankAccountNumberConfirm',
  'bankIfsc',
] as const;

/**
 * Strips KYC identity and bank fields from a seller onboarding form snapshot
 * before it is persisted to localStorage. Always use this (never the raw
 * form values) as the input to `JSON.stringify` for onboarding drafts.
 */
export function sanitizeOnboardingDraftForStorage(
  values: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = { ...values };
  for (const field of SENSITIVE_ONBOARDING_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
}

export function getLocalPendingFlag(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SELLER_PENDING_STORAGE_KEY) === 'true';
}

export function setLocalPendingFlag(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(SELLER_PENDING_STORAGE_KEY, 'true');
  } else {
    window.localStorage.removeItem(SELLER_PENDING_STORAGE_KEY);
  }
}
