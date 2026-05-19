/**
 * Pricing Domain Contract - Core Type Definitions
 */

export interface Price {
  amount: number;
  currency: string;
  formatted: string;
}

export interface DiscountPolicy {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minOrderValue?: number;
  startDate?: string;
  endDate?: string;
}

export interface TaxRate {
  id: string;
  countryCode: string;
  stateCode?: string;
  ratePercentage: number;
  displayName: string;
}

export interface TieredPricing {
  minQuantity: number;
  unitPrice: number;
}
