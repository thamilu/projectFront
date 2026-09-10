import { z } from 'zod';

export const PhoneSchema = z
  .string()
  .regex(/^(\+?[0-9]{7,15})?$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

export const PincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode format (6 digits)')
  .min(6, 'Pincode must be 6 digits')
  .max(6, 'Pincode must be 6 digits');

export const AddressSchema = z.object({
  addressLine1: z.string().min(3, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: PincodeSchema,
});
