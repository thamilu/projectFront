import * as z from 'zod';
import { SellerIdentityType, SellerBusinessType } from './types';

export const sellerOnboardingSchema = z.object({
  // Step 3: Identity
  identityType: z.nativeEnum(SellerIdentityType),
  businessTypes: z.array(z.nativeEnum(SellerBusinessType)).min(1, 'Select at least one business type'),
  
  // Step 1: Personal Info (from User Profile)
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferredLanguage: z.string().optional(),
  alternatePhone: z.string().optional(),
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
  panNumber: z.string().optional().refine(val => !val || val.length === 10, 'PAN must be 10 characters'),
  aadhaarNumber: z.string().optional().refine(val => !val || val.length === 12, 'Aadhaar must be 12 digits'),
  gstin: z.string().optional().refine(val => !val || val.length === 15, 'GSTIN must be 15 characters'),
  businessPan: z.string().optional().refine(val => !val || val.length === 10, 'Business PAN must be 10 characters'),

  // Step 5: Store Setup
  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  description: z.string().max(1000).optional(),
  businessPhone: z.string().regex(/^[+\d\s\-().]{7,25}$/, 'Invalid support phone number').optional().or(z.literal('')),
  
  storeAddressLine1: z.string().min(5, 'Store address is required').max(500),
  storeAddressLine2: z.string().max(500).optional().or(z.literal('')),
  storeCity: z.string().min(2, 'Store city is required').max(100),
  storeDistrict: z.string().min(2, 'Store district is required').max(100),
  storeState: z.string().min(2, 'Store state is required').max(100),
  storePincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  storeCountry: z.string().min(2).default('India'),
  googleMapsUrl: z.string().url('Invalid Google Maps URL').optional().or(z.literal('')),
  
  // Step 6: Terms
  acceptedTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

export type SellerOnboardingFormData = z.infer<typeof sellerOnboardingSchema>;
export type SellerOnboardingValues = SellerOnboardingFormData;

export const sellerProfileUpdateSchema = sellerOnboardingSchema.omit({ 
  acceptedTerms: true 
});

export type SellerProfileUpdateValues = z.infer<typeof sellerProfileUpdateSchema>;

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
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  googleMapsUrl: z.string().url().optional().or(z.literal('')),
});

export type StoreCreateFormData = z.infer<typeof storeCreateSchema>;
