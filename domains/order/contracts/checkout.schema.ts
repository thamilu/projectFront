import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200),
  apartment: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postalCode: z.string().min(2, 'Postal code is required').max(20),
  country: z.string().min(2).max(100),
});

export const CardSchema = z.object({
  name: z.string().min(1, 'Cardholder name is required'),
  number: z.string().min(12, 'Card number looks short').max(19),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, 'Expiry must be MM/YY'),
  cvc: z.string().min(3).max(4),
});

export const CheckoutSchema = z.object({
  shipping: AddressSchema,
  billingSameAsShipping: z.boolean().default(true),
  billing: AddressSchema.optional(),
  paymentMethod: z.enum(['card', 'upi', 'wallet', 'emi']),
  card: CardSchema.optional(),
  acceptTerms: z.boolean().refine(v => v === true, { message: 'You must accept the terms' }),
});

export type CheckoutFormValues = z.infer<typeof CheckoutSchema>;

export default CheckoutSchema;
