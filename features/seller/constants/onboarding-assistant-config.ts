export type TranslationKey = string & { readonly __brand: 'TranslationKey' };

export interface DocumentRequirement {
  id: string;
  labelKey: TranslationKey;
  required: boolean;
  hintKey?: TranslationKey;
}

export type MarketCode = 'IN' | 'US';

export const SUPPORT_CONFIG = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'seller-support@eshop.com',
  subject: 'Seller Onboarding Help',
} as const;

export const MARKET_DOCUMENTS: Record<MarketCode, DocumentRequirement[]> = {
  IN: [
    { id: 'pan', labelKey: 'sellerOnboarding.assistant.docs.pan' as TranslationKey, required: true, hintKey: 'sellerOnboarding.assistant.docs.panHint' as TranslationKey },
    { id: 'aadhar', labelKey: 'sellerOnboarding.assistant.docs.aadhar' as TranslationKey, required: true, hintKey: 'sellerOnboarding.assistant.docs.aadharHint' as TranslationKey },
    { id: 'gstin', labelKey: 'sellerOnboarding.assistant.docs.gstin' as TranslationKey, required: false, hintKey: 'sellerOnboarding.assistant.docs.gstinHint' as TranslationKey },
    { id: 'bank', labelKey: 'sellerOnboarding.assistant.docs.bank' as TranslationKey, required: true },
  ],
  US: [
    { id: 'ssn', labelKey: 'sellerOnboarding.assistant.docs.ssn' as TranslationKey, required: true },
    { id: 'govId', labelKey: 'sellerOnboarding.assistant.docs.govId' as TranslationKey, required: true },
    { id: 'bank', labelKey: 'sellerOnboarding.assistant.docs.bank' as TranslationKey, required: true },
  ],
} as const;

export const STEP_ESTIMATES: Record<string, number> = {
  'personal-info': 1,
  'permanent-address': 2,
  'identity': 1,
  'kyc': 5,
  'store': 3,
  'terms': 1,
} as const;

export const APPROVAL_STAGE_KEYS = ['register', 'verify', 'launch'] as const;
export type ApprovalStageKey = typeof APPROVAL_STAGE_KEYS[number];
