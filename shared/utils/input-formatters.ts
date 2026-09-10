/**
 * input-formatters.ts
 *
 * Utility functions to format and sanitize user inputs
 * for PAN, Aadhaar, and GSTIN fields.
 */

export const toUpperCaseAlphanumeric = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const formatAadhaar = (value: string): string =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim()
    .slice(0, 14);

export const formatGSTIN = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 15);
