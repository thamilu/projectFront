import { z } from 'zod';
import { GENDER_VALUES, PROFILE_CONFIG } from '@/features/users/utils/profile.constants';

const UNICODE_NAME_REGEX = /^[\p{L}\p{M}\s'.-]+$/u;
const E164_PHONE_REGEX = /^(\+?[1-9]\d{6,14})?$/;
const { MAX_NAME_LENGTH } = PROFILE_CONFIG;

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(MAX_NAME_LENGTH, `Maximum ${MAX_NAME_LENGTH} characters allowed`)
    .regex(UNICODE_NAME_REGEX, 'Name contains invalid characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(MAX_NAME_LENGTH, `Maximum ${MAX_NAME_LENGTH} characters allowed`)
    .regex(UNICODE_NAME_REGEX, 'Name contains invalid characters'),
  email: z.string().email('Invalid email format (e.g. user@example.com)').max(255),
  phone: z
    .string()
    .trim()
    .regex(
      E164_PHONE_REGEX,
      'Invalid phone format. Please enter a valid international number (e.g. +919876543210)'
    )
    .optional()
    .or(z.literal('')),
  alternatePhone: z
    .string()
    .trim()
    .regex(
      E164_PHONE_REGEX,
      'Invalid phone format'
    )
    .optional()
    .or(z.literal('')),
  preferredLanguage: z.string().max(20).optional().or(z.literal('')),
  gender: z
    .enum(GENDER_VALUES as [string, ...string[]], {
      message: 'Please select a valid gender option',
    })
    .optional()
    .or(z.literal('')),
  dateOfBirth: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Date of birth cannot be in the future')
    .optional()
    .or(z.literal('')),

  // Address fields
  addressLine1: z.string().max(500, 'Maximum 500 characters allowed').optional().or(z.literal('')),
  addressLine2: z.string().max(500, 'Maximum 500 characters allowed').optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  district: z.string().max(100).optional().or(z.literal('')),
  taluk: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Invalid pincode (6 digits)')
    .optional()
    .or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  timezone: z.string().max(100).optional().or(z.literal('')),
  currency: z.string().max(10).optional().or(z.literal('')),
  locale: z.string().max(10).optional().or(z.literal('')),
});

export type ProfileValues = z.infer<typeof profileSchema>;
