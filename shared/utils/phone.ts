import { parsePhoneNumberFromString } from 'libphonenumber-js';

export type NormalizePhoneResult = {
  e164?: string;
  national?: string;
  error?: string;
};

/**
 * Normalize and validate a phone number.
 * - Assumes `defaultCountry` when the input doesn't start with `+`.
 * - Returns E.164 in `e164` on success, or an `error` message on failure.
 */
export function normalizePhone(input: string, defaultCountry = 'IN'): NormalizePhoneResult {
  if (!input) return { error: 'Phone is empty' };

  const phoneInput = input.trim();

  try {
    const country: string | undefined = phoneInput.startsWith('+') ? undefined : defaultCountry;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = parsePhoneNumberFromString(String(phoneInput), country as any);
    if (!parsed || !parsed.isValid()) {
      return { error: 'Invalid phone number' };
    }

    return { e164: parsed.number, national: parsed.nationalNumber };
  } catch {
    return { error: 'Invalid phone number' };
  }
}
