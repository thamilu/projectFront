import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { IdentityStep } from '@/features/seller/components/steps/IdentityStep';
import { SellerIdentityType } from '@/domains/seller/contracts/seller.types';

// Mock next-auth/react to prevent ESM import syntax errors during Jest barrel file resolution
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

// Mock leaflet to prevent ESM import syntax errors during Jest barrel file resolution
jest.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));
jest.mock('leaflet', () => ({
  icon: jest.fn(() => ({})),
  Marker: {
    prototype: {
      options: {
        icon: {},
      },
    },
  },
}));

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.identity.title': 'Seller Identity',
        'sellerOnboarding.identity.description': 'Choose how you will be identified on our platform.',
        'sellerOnboarding.identity.categoriesHeading': 'Business Categories',
        'sellerOnboarding.identity.individual.title': 'Individual',
        'sellerOnboarding.identity.individual.desc': 'Perfect for sole traders, freelancers, or home-based businesses.',
        'sellerOnboarding.identity.business.title': 'Business',
        'sellerOnboarding.identity.business.desc': 'Ideal for registered companies, enterprises, or large brands.',
        'sellerOnboarding.identity.selected': 'Selected Category',
        'sellerOnboarding.identity.clickToSelect': 'Tap to select',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

interface WrapperProps {
  children: React.ReactNode;
  defaultValues?: any;
  defaultErrors?: any;
}

function FormWrapper({ children, defaultValues = {}, defaultErrors = {} }: WrapperProps) {
  const methods = useForm({
    defaultValues: {
      identityType: null,
      businessTypes: [],
      ...defaultValues,
    },
  });

  // Inject errors to formState manually using useEffect
  React.useEffect(() => {
    Object.keys(defaultErrors).forEach((key) => {
      methods.setError(key as any, defaultErrors[key]);
    });
  }, [defaultErrors, methods]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('IdentityStep Component', () => {
  it('renders seller identity step headers and options correctly', () => {
    render(
      <FormWrapper>
        <IdentityStep />
      </FormWrapper>
    );

    expect(screen.getByText('Seller Identity')).toBeInTheDocument();
    expect(screen.getByText('Choose how you will be identified on our platform.')).toBeInTheDocument();
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Business Categories')).toBeInTheDocument();
  });

  it('selects identity type individual on card click', () => {
    render(
      <FormWrapper>
        <IdentityStep />
      </FormWrapper>
    );

    const individualCard = screen.getByRole('radio', { name: /individual/i });
    expect(individualCard).toBeInTheDocument();
    expect(individualCard).toHaveAttribute('aria-checked', 'false');

    act(() => {
      fireEvent.click(individualCard);
    });
    expect(individualCard).toHaveAttribute('aria-checked', 'true');
  });

  it('supports interactive keyboard roving navigation across identity type cards', () => {
    render(
      <FormWrapper>
        <IdentityStep />
      </FormWrapper>
    );

    const individualCard = screen.getByRole('radio', { name: /individual/i });
    const businessCard = screen.getByRole('radio', { name: /business/i });

    // Focus individual card (tabIndex=0)
    individualCard.focus();
    expect(document.activeElement).toBe(individualCard);

    // ArrowRight moves focus to business card and selects it
    act(() => {
      fireEvent.keyDown(individualCard, { key: 'ArrowRight' });
    });
    expect(document.activeElement).toBe(businessCard);
    expect(businessCard).toHaveAttribute('aria-checked', 'true');

    // ArrowLeft moves focus back to individual card and selects it
    act(() => {
      fireEvent.keyDown(businessCard, { key: 'ArrowLeft' });
    });
    expect(document.activeElement).toBe(individualCard);
    expect(individualCard).toHaveAttribute('aria-checked', 'true');

    // Press Space on selected card does not break it
    act(() => {
      fireEvent.keyDown(individualCard, { key: ' ' });
    });
    expect(individualCard).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles business category multi-select checkmarks', () => {
    render(
      <FormWrapper defaultValues={{ identityType: SellerIdentityType.BUSINESS, businessTypes: [] }}>
        <IdentityStep />
      </FormWrapper>
    );

    // Get Farmer checkbox category card
    const farmerCheckbox = screen.getByRole('checkbox', { name: /farmer \/ producer/i });
    expect(farmerCheckbox).toBeInTheDocument();
    expect(farmerCheckbox).toHaveAttribute('aria-checked', 'false');

    // Click it to select
    act(() => {
      fireEvent.click(farmerCheckbox);
    });
    expect(farmerCheckbox).toHaveAttribute('aria-checked', 'true');

    // Keydown space bar toggles it off
    act(() => {
      fireEvent.keyDown(farmerCheckbox, { key: ' ' });
    });
    expect(farmerCheckbox).toHaveAttribute('aria-checked', 'false');

    // Keydown Enter toggles it back on
    act(() => {
      fireEvent.keyDown(farmerCheckbox, { key: 'Enter' });
    });
    expect(farmerCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  it('renders validation error alerts when business category checks fail', () => {
    const mockErrors = {
      businessTypes: { type: 'custom', message: 'Please select at least one business category' },
    };

    render(
      <FormWrapper defaultErrors={mockErrors}>
        <IdentityStep />
      </FormWrapper>
    );

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/Please select at least one business category/i);
  });
});
