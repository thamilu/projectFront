/**
 * @fileoverview Currency Configuration and Localization Constants
 *
 * Defines supported currencies, symbols, positioning, and formatting rules
 * for the storefront, with support for Indian (Lakhs/Crores) and
 * International (Millions/Billions) number systems.
 */

export const CURRENCIES = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    decimalPlaces: 2,
    symbolPosition: 'before',
    isActive: true,
    thousandSeparator: ',',
    groupingStyle: 'indian',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
    symbolPosition: 'before',
    isActive: true,
    thousandSeparator: ',',
    groupingStyle: 'international',
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export type Currency = (typeof CURRENCIES)[CurrencyCode];

// Validate default currency from environment safely
const envDefault = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY;
export const DEFAULT_CURRENCY: CurrencyCode = envDefault === 'USD' ? 'USD' : 'INR';
