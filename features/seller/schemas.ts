import * as z from 'zod';
import { SellerIdentityType, SellerBusinessType } from './types';

export const sellerOnboardingSchema = z.object({
  identityType: z.nativeEnum(SellerIdentityType),
  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  businessName: z.string().optional(),
  businessTypes: z.array(z.nativeEnum(SellerBusinessType)).min(1, 'Select at least one business type'),
  
  // Personal / Permanent Address (Step 1)
  addressLine1: z.string().min(5, 'Address is required').max(500),
  addressLine2: z.string().max(500).optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100),
  district: z.string().min(2, 'District is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  country: z.string().min(2).default('India'),
  
  // Store / Warehouse Address (Step 3)
  storeAddressLine1: z.string().min(5, 'Store address is required').max(500),
  storeAddressLine2: z.string().max(500).optional().or(z.literal('')),
  storeCity: z.string().min(2, 'Store city is required').max(100),
  storeDistrict: z.string().min(2, 'Store district is required').max(100),
  storeState: z.string().min(2, 'Store state is required').max(100),
  storePincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  storeCountry: z.string().min(2).default('India'),
  
  googleMapsUrl: z.string().url('Invalid Google Maps URL').optional().or(z.literal('')),
  
  // Contact Info
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid personal phone number'),
  businessPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid support phone number').optional().or(z.literal('')),
  
  description: z.string().max(1000).optional(),
  acceptedTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

export type SellerOnboardingValues = z.infer<typeof sellerOnboardingSchema>;

export const sellerProfileUpdateSchema = sellerOnboardingSchema.omit({ 
  acceptedTerms: true 
});

export type SellerProfileUpdateValues = z.infer<typeof sellerProfileUpdateSchema>;
