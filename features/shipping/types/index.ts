export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}
