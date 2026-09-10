// Mock next-auth/react first before any feature imports to prevent ESM import syntax errors
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddProductForm } from '@/features/seller/components/AddProductForm';
import { useProductFormController } from '@/features/seller/hooks/use-product-form-controller';
import { trackEvent } from '@/core/providers/analytics-provider';

// Mock dependencies
jest.mock('@/features/seller/hooks/use-product-form-controller');

jest.mock('@/features/seller/components/ProductFormShell', () => ({
  ProductFormShell: () => <div data-testid="mock-form-shell">Mock Product Form Shell</div>,
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'products.form.loadError': 'Failed to load product form information.',
        'products.form.timeoutError': 'Request timed out. Please check your connection and try again.',
        'common.retry': 'Retry',
      };
      return translations[key] || (options?.defaultValue as string) || key;
    },
  }),
}));

const mockRefetch = jest.fn();

const defaultControllerValue = {
  mode: 'create' as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: {} as any,
  activeTab: 'basic',
  setActiveTab: jest.fn(),
  isLoading: false,
  isError: false,
  error: null,
  refetch: mockRefetch,
  catalog: { categoryList: [], brandList: [], filteredBrands: [] },
  media: { imageFiles: [], setImageFiles: jest.fn(), existingImages: [] },
  submit: { onSubmit: jest.fn(), handleInvalidSubmit: jest.fn(), isSubmitting: false },
};

describe('AddProductForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useProductFormController as jest.Mock).mockReturnValue(defaultControllerValue);
  });

  it('renders loading skeleton when controller is loading', () => {
    (useProductFormController as jest.Mock).mockReturnValue({
      ...defaultControllerValue,
      isLoading: true,
    });

    render(<AddProductForm />);

    expect(screen.getByTestId('product-form-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-form-shell')).not.toBeInTheDocument();
  });

  it('renders form shell when controller completes loading', () => {
    render(<AddProductForm />);

    expect(screen.getByTestId('product-form-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-form-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('product-form-skeleton')).not.toBeInTheDocument();

    // Verify view and loaded telemetry
    expect(trackEvent).toHaveBeenCalledWith('product_form_viewed', { mode: 'create' });
    expect(trackEvent).toHaveBeenCalledWith('product_form_loaded', expect.any(Object));
  });

  it('renders general error state when isError is true', () => {
    (useProductFormController as jest.Mock).mockReturnValue({
      ...defaultControllerValue,
      isError: true,
      error: new Error('LOAD_FAILED'),
    });

    render(<AddProductForm />);

    expect(screen.getByTestId('product-form-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load product form information.')).toBeInTheDocument();

    const retryBtn = screen.getByTestId('product-form-retry');
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();

    // Verify failure telemetry
    expect(trackEvent).toHaveBeenCalledWith('product_form_load_failed', {
      mode: 'create',
      error_message: 'LOAD_FAILED',
      is_timeout: false,
    });
  });

  it('renders timeout error state when error is LOADING_TIMEOUT', () => {
    (useProductFormController as jest.Mock).mockReturnValue({
      ...defaultControllerValue,
      isError: true,
      error: new Error('LOADING_TIMEOUT'),
    });

    render(<AddProductForm />);

    expect(screen.getByTestId('product-form-error')).toBeInTheDocument();
    expect(
      screen.getByText('Request timed out. Please check your connection and try again.')
    ).toBeInTheDocument();

    // Verify failure telemetry
    expect(trackEvent).toHaveBeenCalledWith('product_form_load_failed', {
      mode: 'create',
      error_message: 'LOADING_TIMEOUT',
      is_timeout: true,
    });
  });

  it('shifts keyboard focus to the form container on load resolution', () => {
    render(<AddProductForm />);
    const containerEl = screen.getByTestId('product-form-container');
    
    // Focus should be programmatic
    expect(containerEl).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement).toBe(containerEl);
  });
});
