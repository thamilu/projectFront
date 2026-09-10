export interface Step {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly requiresDocumentChecklist?: boolean;
}

export const STEPS: readonly Step[] = [
  { id: 'personal-info', title: 'Personal', description: 'Contact details' },
  { id: 'permanent-address', title: 'Address', description: 'Residential info', requiresDocumentChecklist: true },
  { id: 'identity', title: 'Identity', description: 'Business type', requiresDocumentChecklist: true },
  { id: 'kyc', title: 'Legal', description: 'KYC Verification', requiresDocumentChecklist: true },
  { id: 'store', title: 'Store', description: 'Shop setup' },
  { id: 'terms', title: 'Terms', description: 'Agreement' },
] as const;

export const SELLER_FORM_DEFAULTS = {
  DEFAULT_COUNTRY: 'India',
} as const;
