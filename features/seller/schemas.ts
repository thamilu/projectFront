import * as z from 'zod';
import { SellerIdentityType, SellerBusinessType } from './types';

export const sellerOnboardingSchema = z.object({
  // Step 3: Identity
  identityType: z.nativeEnum(SellerIdentityType),
  businessTypes: z.array(z.nativeEnum(SellerBusinessType)).min(1, 'Select at least one business type'),
  
  // Step 1: Personal Info (from User Profile)
  firstName: z.string().default(''),
  lastName: z.string().default(''),
  email: z.string().email().optional().or(z.literal('')),
  gender: z.string().default(''),
  dateOfBirth: z.string().default(''),
  preferredLanguage: z.string().default(''),
  alternatePhone: z.string().default(''),
  phone: z.string().regex(/^[+\d\s\-().]{7,25}$/, 'Invalid personal phone number'),

  // Step 2: Personal / Permanent Address
  addressLine1: z.string().min(5, 'Address is required').max(500),
  addressLine2: z.string().max(500).optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100),
  district: z.string().min(2, 'District is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  country: z.string().min(2).default('India'),
  
  // Step 4: Verification (KYC)
  panNumber: z.string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN format (e.g. ABCDE1234F)')
    .or(z.literal(''))
    .default(''),
  aadhar: z.string().trim().default(''),
  gstin: z.string()
    .trim()
    .regex(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/i, 'Invalid GSTIN format')
    .or(z.literal(''))
    .default(''),
  businessPan: z.string().default(''),
  businessName: z.string().default(''),
  taxId: z.string().default(''),

  // Farmer Details
  isOwnProduce: z.boolean().default(true),
  farmLocationVillage: z.string().default(''),

  // Step 5: Store Setup
  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  description: z.string().default(''),
  businessPhone: z.string().default(''),
  
  storeAddressLine1: z.string().min(5, 'Store address is required').max(500),
  storeAddressLine2: z.string().max(500).optional().or(z.literal('')),
  storeCity: z.string().min(2, 'Store city is required').max(100),
  storeDistrict: z.string().min(2, 'Store district is required').max(100),
  storeState: z.string().min(2, 'Store state is required').max(100),
  storePincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  storeCountry: z.string().min(2).default('India'),
  googleMapsUrl: z.string().url('Invalid Google Maps URL').optional().or(z.literal('')),
  
  shopHandle: z.string()
    .min(3, 'Handle must be at least 3 characters')
    .max(50, 'Handle cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed')
    .default(''),
  
  shopLogoUrl: z.string().default(''),
  
  // Step 6: Terms
  acceptedTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

export type SellerOnboardingFormData = z.infer<typeof sellerOnboardingSchema>;
export type SellerOnboardingValues = SellerOnboardingFormData;

export const sellerProfileUpdateSchema = sellerOnboardingSchema.partial().omit({ 
  acceptedTerms: true 
});

export type SellerProfileUpdateValues = z.infer<typeof sellerProfileUpdateSchema>;
export type SellerProfileUpdateFormData = SellerProfileUpdateValues;

export const storeCreateSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  addressLine1: z.string().min(5, 'Address is required').max(500),
  addressLine2: z.string().max(500).optional().or(z.literal('')),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  country: z.string().min(2).default('India'),
  shopHandle: z.string()
    .min(3, 'Handle must be at least 3 characters')
    .max(50, 'Handle cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed')
    .optional().or(z.literal('')),
  shopLogoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  googleMapsUrl: z.string().url().optional().or(z.literal('')),
});

export type StoreCreateFormData = z.infer<typeof storeCreateSchema>;
