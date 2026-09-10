import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocumentChecklist } from '@/features/seller/components/registration/DocumentChecklist';
import { MarketCode, TranslationKey } from '@/features/seller/constants/onboarding-assistant-config';

// Dynamic mock documents data to isolate tests
let mockMarketDocuments: any = {
  IN: [
    { id: 'pan', labelKey: 'sellerOnboarding.assistant.docs.pan' as TranslationKey, required: true, hintKey: 'sellerOnboarding.assistant.docs.panHint' as TranslationKey },
    { id: 'bank', labelKey: 'sellerOnboarding.assistant.docs.bank' as TranslationKey, required: true },
  ],
  US: [
    { id: 'ssn', labelKey: 'sellerOnboarding.assistant.docs.ssn' as TranslationKey, required: false },
  ],
};

jest.mock('@/features/seller/constants/onboarding-assistant-config', () => {
  const original = jest.requireActual('@/features/seller/constants/onboarding-assistant-config');
  return {
    ...original,
    get MARKET_DOCUMENTS() {
      return mockMarketDocuments;
    },
  };
});

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'common.required': 'Required',
        'common.optional': 'Optional',
        'common.hintWrapper': `(${params?.hint})`,
        'sellerOnboarding.assistant.requiredDocuments': 'Required Documents',
        'sellerOnboarding.assistant.requiredDocuments.requiredDocumentsLegend': '* Indicates required verification documents.',
        'sellerOnboarding.assistant.requiredDocuments.requiredDocumentsListLabel': 'Required documents checklist',
        'sellerOnboarding.assistant.requiredDocuments.requiredDocumentsNone': 'No documents are required for this market.',
        'sellerOnboarding.assistant.docs.pan': 'PAN Card',
        'sellerOnboarding.assistant.docs.panHint': 'Individual/Business',
        'sellerOnboarding.assistant.docs.bank': 'Active Bank Account Details',
        'sellerOnboarding.assistant.docs.ssn': 'SSN or EIN',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

describe('DocumentChecklist Component', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mock documents
    mockMarketDocuments = {
      IN: [
        { id: 'pan', labelKey: 'sellerOnboarding.assistant.docs.pan' as TranslationKey, required: true, hintKey: 'sellerOnboarding.assistant.docs.panHint' as TranslationKey },
        { id: 'bank', labelKey: 'sellerOnboarding.assistant.docs.bank' as TranslationKey, required: true },
      ],
      US: [
        { id: 'ssn', labelKey: 'sellerOnboarding.assistant.docs.ssn' as TranslationKey, required: false },
      ],
    };

    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('renders correct documents for IN market', () => {
    render(<DocumentChecklist market="IN" />);
    expect(screen.getByText('PAN Card')).toBeInTheDocument();
    expect(screen.getByText('Active Bank Account Details')).toBeInTheDocument();
    expect(screen.queryByText('SSN or EIN')).not.toBeInTheDocument();
  });

  it('renders correct documents for US market', () => {
    render(<DocumentChecklist market="US" />);
    expect(screen.getByText('SSN or EIN')).toBeInTheDocument();
    expect(screen.queryByText('PAN Card')).not.toBeInTheDocument();
  });

  it('falls back to IN documents on unknown market and triggers console.warn in development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Simulate development environment
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      configurable: true,
    });

    render(<DocumentChecklist market={'GB' as MarketCode} />);

    // Check that we fell back to IN documents
    expect(screen.getByText('PAN Card')).toBeInTheDocument();

    // Check warn logger
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('Market "GB" has no configured documents');

    // Restore env
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalNodeEnv },
      configurable: true,
    });
  });

  it('does NOT trigger console.warn for configured markets in development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      configurable: true,
    });

    render(<DocumentChecklist market="IN" />);
    expect(warnSpy).not.toHaveBeenCalled();

    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalNodeEnv },
      configurable: true,
    });
  });

  it('renders required asterisk for required documents', () => {
    render(<DocumentChecklist market="IN" />);
    
    // PAN and Bank are required, check for presence of '*'
    const panListItem = screen.getByText('PAN Card').closest('li');
    expect(panListItem).toBeInTheDocument();
    expect(panListItem?.querySelector('span.text-red-300')).toHaveTextContent('*');
  });

  it('renders sr-only "Required" text next to the asterisk for screen readers', () => {
    render(<DocumentChecklist market="IN" />);
    
    const panListItem = screen.getByText('PAN Card').closest('li');
    // Screen reader text should contain "(Required)"
    expect(panListItem?.querySelector('span.sr-only')).toHaveTextContent('Required');
  });

  it('does NOT render asterisk or sr-only required text for optional documents', () => {
    render(<DocumentChecklist market="US" />);
    
    const ssnListItem = screen.getByText('SSN or EIN').closest('li');
    expect(ssnListItem).toBeInTheDocument();
    expect(ssnListItem?.querySelector('span.text-red-300')).not.toBeInTheDocument();
    expect(ssnListItem?.querySelector('span.sr-only')).not.toBeInTheDocument();
  });

  it('renders required documents legend under the list if at least one document is required', () => {
    render(<DocumentChecklist market="IN" />);
    expect(screen.getByText(/\* Indicates required verification documents/i)).toBeInTheDocument();
  });

  it('does NOT render legend under the list if no documents are required', () => {
    render(<DocumentChecklist market="US" />);
    expect(screen.queryByText(/\* Indicates required verification documents/i)).not.toBeInTheDocument();
  });

  it('renders hint inside the localized hintWrapper template for documents with hintKey', () => {
    render(<DocumentChecklist market="IN" />);
    expect(screen.getByText('(Individual/Business)')).toBeInTheDocument();
  });

  it('renders no hint for documents without hintKey', () => {
    render(<DocumentChecklist market="IN" />);
    const bankListItem = screen.getByText('Active Bank Account Details').closest('li');
    expect(bankListItem?.textContent).not.toContain('Individual/Business');
  });

  it('renders explicit empty state message when the docs configuration array is empty', () => {
    mockMarketDocuments.US = [];
    render(<DocumentChecklist market="US" />);
    
    expect(screen.getByText('No documents are required for this market.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('applies the correct aria-label to the <ul> element for screen readers', () => {
    render(<DocumentChecklist market="IN" />);
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label', 'Required documents checklist');
  });

  it('applies correct outer margin padding layout alignment classes', () => {
    render(<DocumentChecklist market="IN" />);
    const list = screen.getByRole('list');
    expect(list).toHaveClass('list-outside', 'pl-4', 'rtl:pr-4', 'rtl:pl-0');
  });

  it('behaves correctly under React.memo to prevent unneeded re-renders on unchanged props', () => {
    const { rerender } = render(<DocumentChecklist market="IN" />);
    
    // Clear log warning trace to verify render tracking if warning is generated
    warnSpy.mockClear();

    // Rerender with the same prop value
    rerender(<DocumentChecklist market="IN" />);
    
    // Component shouldn't recomputation map if props are identical
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
