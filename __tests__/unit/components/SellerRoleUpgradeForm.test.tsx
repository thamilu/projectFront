// Mock routing hooks and next-auth/react first before any feature imports
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'sellerOnboarding.progress.stepText') {
        return `Step ${params?.current} of ${params?.total}`;
      }
      if (key === 'sellerOnboarding.progress.timeEstimate') {
        return `Approx. ${params?.minutes} min remaining`;
      }
      return key;
    },
  }),
}));

jest.mock('@/features/seller/components/steps/PersonalInfoStep', () => ({
  PersonalInfoStep: () => <div data-testid="personal-step">PersonalInfoStep</div>,
}));
jest.mock('@/features/seller/components/steps/PermanentAddressStep', () => ({
  PermanentAddressStep: () => <div data-testid="address-step">PermanentAddressStep</div>,
}));
jest.mock('@/features/seller/components/steps/IdentityStep', () => ({
  IdentityStep: () => <div data-testid="identity-step">IdentityStep</div>,
}));
jest.mock('@/features/seller/components/steps/KycStep', () => ({
  KycStep: () => <div data-testid="kyc-step">KycStep</div>,
}));
jest.mock('@/features/seller/components/steps/StoreStep', () => ({
  StoreStep: () => <div data-testid="store-step">StoreStep</div>,
}));
jest.mock('@/features/seller/components/steps/TermsStep', () => ({
  TermsStep: () => <div data-testid="terms-step">TermsStep</div>,
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { SellerRoleUpgradeForm } from '@/features/seller/components/SellerRoleUpgradeForm';
import { useSellerForm } from '@/features/seller/hooks/useSellerForm';

jest.mock('@/features/seller/hooks/useSellerForm');

const mockUseSellerForm = useSellerForm as jest.Mock;

describe('SellerRoleUpgradeForm Component', () => {
  let mockMethods: any;
  let mockNext: jest.Mock;
  let mockPrev: jest.Mock;
  let mockHandleForceSync: jest.Mock;
  let mockHandleRetry: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
    mockPrev = jest.fn();
    mockHandleForceSync = jest.fn();
    mockHandleRetry = jest.fn();

    const TestComponent = () => {
      mockMethods = useForm({
        defaultValues: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: '',
          dateOfBirth: '',
          preferredLanguage: '',
          alternatePhone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          district: '',
          taluk: '',
          state: '',
          pincode: '',
          country: 'India',
          identityType: 'INDIVIDUAL',
          businessTypes: [],
          shopName: '',
          acceptedTerms: false,
        },
      });
      return null;
    };
    render(<TestComponent />);

    mockUseSellerForm.mockReturnValue({
      methods: mockMethods,
      status: 'IDLE',
      currentStep: 0,
      isSubmitting: false,
      isSyncing: false,
      next: mockNext,
      prev: mockPrev,
      handleForceSync: mockHandleForceSync,
      handleRetry: mockHandleRetry,
      user: { email: 'seller@example.com' },
      isSeller: false,
      errorMessage: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly in IDLE state with first step active', () => {
    render(<SellerRoleUpgradeForm />);

    // Check if form is visible
    expect(screen.getByRole('form', { name: /Seller registration/i })).toBeInTheDocument();

    // Check navigation buttons
    expect(screen.getByRole('button', { name: /Back/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next Step/i })).toBeInTheDocument();

    // Check progress indicators
    expect(screen.getByTestId('step-progress-text')).toHaveTextContent('Step 1 of 6');
    expect(screen.getByTestId('step-time-estimate')).toHaveTextContent('Approx. 6 min remaining');
  });

  it('triggers next callback when Next Step button is clicked', async () => {
    render(<SellerRoleUpgradeForm />);

    const nextBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('renders PENDING status screen correctly', () => {
    mockUseSellerForm.mockReturnValue({
      methods: mockMethods,
      status: 'PENDING',
      currentStep: 0,
      isSubmitting: false,
      isSyncing: false,
      next: mockNext,
      prev: mockPrev,
      handleForceSync: mockHandleForceSync,
      handleRetry: mockHandleRetry,
      user: { email: 'seller@example.com' },
      isSeller: false,
      errorMessage: null,
    });

    render(<SellerRoleUpgradeForm />);
    expect(screen.getByText(/Registration Submitted/i)).toBeInTheDocument();
  });

  it('renders SUCCESS status screen correctly', () => {
    mockUseSellerForm.mockReturnValue({
      methods: mockMethods,
      status: 'SUCCESS',
      currentStep: 5,
      isSubmitting: false,
      isSyncing: false,
      next: mockNext,
      prev: mockPrev,
      handleForceSync: mockHandleForceSync,
      handleRetry: mockHandleRetry,
      user: { email: 'seller@example.com' },
      isSeller: true,
      errorMessage: null,
    });

    render(<SellerRoleUpgradeForm />);
    expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
  });

  it('renders ERROR status screen correctly and allows retry', () => {
    mockUseSellerForm.mockReturnValue({
      methods: mockMethods,
      status: 'ERROR',
      currentStep: 3,
      isSubmitting: false,
      isSyncing: false,
      next: mockNext,
      prev: mockPrev,
      handleForceSync: mockHandleForceSync,
      handleRetry: mockHandleRetry,
      user: { email: 'seller@example.com' },
      isSeller: false,
      errorMessage: 'Submission failed',
    });

    render(<SellerRoleUpgradeForm />);
    expect(screen.getByText(/Submission failed/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryBtn);
    expect(mockHandleRetry).toHaveBeenCalledTimes(1);
  });
});
