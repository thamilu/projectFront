import * as z from 'zod';
import { SellerIdentityType, SellerBusinessType } from '@/domains/seller/contracts/seller.types';
import {
  SHOP_HANDLE_MAX_LENGTH,
  SHOP_HANDLE_MESSAGES,
  SHOP_HANDLE_MIN_LENGTH,
  SHOP_HANDLE_PATTERN,
} from '@/domains/seller/contracts/shop-handle';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

/**
 * Handle validation, built from the shared rules in `shop-handle.ts`.
 *
 * The onboarding and store-create schemas both need it with different
 * optionality, so this returns a fresh builder rather than a shared instance —
 * chaining `.optional()` onto one shared schema object would be fine in Zod, but
 * a factory keeps the two call sites visibly independent.
 */
const shopHandleField = () =>
  z
    .string()
    .min(SHOP_HANDLE_MIN_LENGTH, SHOP_HANDLE_MESSAGES.tooShort)
    .max(SHOP_HANDLE_MAX_LENGTH, SHOP_HANDLE_MESSAGES.tooLong)
    .regex(SHOP_HANDLE_PATTERN, SHOP_HANDLE_MESSAGES.invalidCharacters);

const sellerOnboardingBaseSchema = z.object({
  identityType: z.nativeEnum(SellerIdentityType),
  businessTypes: z
    .array(z.nativeEnum(SellerBusinessType))
    .min(1, 'Select at least one business type'),

  firstName: z.string().default(''),
  lastName: z.string().default(''),
  email: z.string().email().optional().or(z.literal('')),
  gender: z.string().default(''),
  dateOfBirth: z.string().default(''),
  preferredLanguage: z.string().default(''),
  alternatePhone: z
    .string()
    .regex(/^(\+?[0-9]{7,15})?$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^(\+?[0-9]{7,15})?$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),

  addressLine1: z.string().min(5, 'Address is required').max(500),
  addressLine2: z.string().max(500).optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100),
  district: z.string().min(2, 'District is required').max(100),
  taluk: z.string().max(100).optional().or(z.literal('')),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  country: z.string().min(2).default('India'),

  panNumber: z
    .string()
    .trim()
    .regex(PAN_REGEX, 'Invalid PAN format (e.g. ABCDE1234F)')
    .or(z.literal(''))
    .default(''),
  aadhar: z
    .string()
    .trim()
    .regex(/^\d{12}$/, 'Invalid Aadhar format (12 digits)')
    .optional()
    .or(z.literal('')),
  gstin: z
    .string()
    .trim()
    .regex(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/i, 'Invalid GSTIN format')
    .or(z.literal(''))
    .default(''),
  // Regression: this previously had NO format validation at all (bare
  // `z.string().default('')`), unlike panNumber right above it — a
  // malformed Business PAN could pass step and final submit validation.
  businessPan: z
    .string()
    .trim()
    .regex(PAN_REGEX, 'Invalid PAN format (e.g. ABCDE1234F)')
    .or(z.literal(''))
    .default(''),
  businessName: z.string().default(''),
  taxId: z.string().default(''),
  authorizedSignatory: z.string().default(''),

  isOwnProduce: z.boolean().default(true),
  farmLocationVillage: z.string().default(''),

  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  description: z.string().default(''),
  businessPhone: z
    .string()
    .regex(/^(\+?[0-9]{7,15})?$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),

  storeAddressLine1: z.string().min(5, 'Store address is required').max(500),
  storeAddressLine2: z.string().max(500).optional().or(z.literal('')),
  storeCity: z.string().min(2, 'Store city is required').max(100),
  storeDistrict: z.string().min(2, 'Store district is required').max(100),
  storeTaluk: z.string().max(100).optional().or(z.literal('')),
  storeState: z.string().min(2, 'Store state is required').max(100),
  storePincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  storeCountry: z.string().min(2).default('India'),
  googleMapsUrl: z.string().url('Invalid Google Maps URL').optional().or(z.literal('')),

  shopHandle: shopHandleField().default(''),

  shopLogoUrl: z.string().nullable().optional().default(''),

  // Regression: these three previously had zero validation at all (bare
  // `z.string().default('')`) — a seller could complete onboarding with no
  // real payout account on file, and a malformed account number/IFSC would
  // pass silently. Regex matches the format checks StoreStep's bank
  // fieldset already performs live (isIfscFormatValid); the confirm-match
  // check happens in the superRefine below since Zod object-level field
  // fields can't cross-reference each other directly.
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{9,18}$/, 'Enter a valid bank account number (9-18 digits)'),
  bankAccountNumberConfirm: z.string().trim().default(''),
  bankIfsc: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Enter a valid 11-character IFSC code (e.g. SBIN0123456)')
    .transform((val) => val.toUpperCase()),

  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'TERMS_NOT_ACCEPTED',
  }),
});

/**
 * Regression: every KYC identity field (panNumber, aadhar, gstin,
 * businessPan) was independently optional-or-empty-string, with no rule
 * anywhere requiring ANY of them based on identityType. Combined with
 * getFieldsForStep(3) only re-running these same permissive per-field
 * rules, a seller could click through the entire "Legal / KYC
 * Verification" step — and complete the whole onboarding wizard — with
 * every identity field left blank, defeating the purpose of a KYC gate.
 * This enforces PAN+Aadhaar for individual sellers and Business PAN+GSTIN
 * for business sellers. Errors are attached to the specific field paths
 * (['panNumber'], ['aadhar'], etc.) so getFieldsForStep(3)'s per-step
 * `trigger(['panNumber','aadhar','gstin','businessPan'])` call picks them
 * up correctly — the same fields step 3 already validates.
 */
export const sellerOnboardingSchema = sellerOnboardingBaseSchema.superRefine((data, ctx) => {
  if (data.identityType === SellerIdentityType.INDIVIDUAL) {
    if (!data.panNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['panNumber'],
        message: 'PAN number is required to verify your identity',
      });
    }
    if (!data.aadhar) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['aadhar'],
        message: 'Aadhaar number is required to verify your identity',
      });
    }
  } else if (data.identityType === SellerIdentityType.BUSINESS) {
    if (!data.businessPan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['businessPan'],
        message: 'Business PAN is required to verify your business',
      });
    }
    if (!data.gstin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gstin'],
        message: 'GSTIN is required to verify your business',
      });
    }
  }

  // Zod object fields can't cross-reference each other directly, so the
  // "confirm" match check for the bank account number lives here.
  if (data.bankAccountNumberConfirm !== data.bankAccountNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bankAccountNumberConfirm'],
      message: 'Account numbers do not match',
    });
  }
});

export type SellerOnboardingFormData = z.infer<typeof sellerOnboardingBaseSchema>;
export type SellerOnboardingValues = SellerOnboardingFormData;

// Partial() is only available on the base ZodObject, not the refined
// ZodEffects produced by .superRefine() above — profile updates are
// legitimately partial (a PATCH need not resend every KYC field), so this
// intentionally uses the base schema rather than the onboarding-time one.
export const sellerProfileUpdateSchema = sellerOnboardingBaseSchema.partial().omit({
  acceptedTerms: true,
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
  taluk: z.string().max(100).optional().or(z.literal('')),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  country: z.string().min(2).default('India'),
  shopHandle: shopHandleField().optional().or(z.literal('')),
  shopLogoUrl: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  googleMapsUrl: z.string().url().optional().or(z.literal('')),
  currencyCode: z.string().min(3).max(3).optional().default('INR'),
});

export type StoreCreateFormData = z.infer<typeof storeCreateSchema>;
