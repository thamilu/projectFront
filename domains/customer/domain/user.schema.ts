import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'Maximum 100 characters allowed'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Maximum 100 characters allowed'),
  email: z.string().email('Invalid email').max(255),
  phone: z.string()
    .regex(/^(\+?[0-9]{7,15})?$/, 'Invalid phone number format')
    .optional().or(z.literal('')),
  alternatePhone: z.string()
    .regex(/^(\+?[0-9]{7,15})?$/, 'Invalid phone number format')
    .optional().or(z.literal('')),
  preferredLanguage: z.string().max(20).optional().or(z.literal('')),
  gender: z.string().max(20).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  
  // Permanent Address
  addressLine1: z.string().max(500, 'Maximum 500 characters allowed').optional().or(z.literal('')),
  addressLine2: z.string().max(500, 'Maximum 500 characters allowed').optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  district: z.string().max(100).optional().or(z.literal('')),
  taluk: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)').optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
});

export type ProfileValues = z.infer<typeof profileSchema>;
