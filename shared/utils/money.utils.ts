import { CURRENCIES, type CurrencyCode } from '../constants';

export type Cents = number & { readonly __brand: 'Cents' };

export const toCents = (dollars: number): Cents => Math.round(dollars * 100) as Cents;
export const fromCents = (cents: Cents): number => cents / 100;
export const addMoney = (a: Cents, b: Cents): Cents => (a + b) as Cents;
export const multiplyMoney = (cents: Cents, multiplier: number): Cents =>
  Math.round(cents * multiplier) as Cents;

export function formatMoney(cents: Cents, currencyCode: CurrencyCode = 'INR'): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.INR;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(fromCents(cents));
}
