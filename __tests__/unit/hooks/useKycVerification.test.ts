import { renderHook } from '@testing-library/react';
import { useKycVerification } from '@/features/seller/hooks/use-kyc-verification';
import { useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useWatch: jest.fn(),
}));

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

// Mock telemetry & Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useKycVerification Hook', () => {
  const mockControl = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unverified and not verifying by default when values are empty', () => {
    // Mock useWatch to return empty strings
    (useWatch as jest.Mock).mockImplementation(() => {
      return '';
    });

    // Mock useQuery to return loading/success defaults
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });

    const { result } = renderHook(() => useKycVerification(mockControl, {}));

    expect(result.current.isBusinessPanVerified).toBe(false);
    expect(result.current.isBusinessPanVerifying).toBe(false);
    expect(result.current.isGstinVerified).toBe(false);
    expect(result.current.isGstinVerifying).toBe(false);
  });

  it('should enable validation and show verified true when regex matches and query succeeds', () => {
    // Mock useWatch to return valid PAN and GSTIN
    (useWatch as jest.Mock).mockImplementation(({ name }) => {
      if (name === 'businessPan') return 'ABCDE1234F';
      if (name === 'gstin') return '22AAAAA0000A1Z5';
      return '';
    });

    // Mock useQuery to return verified: true
    (useQuery as jest.Mock).mockReturnValue({
      data: { verified: true },
      isLoading: false,
      isFetching: false,
    });

    const { result } = renderHook(() => useKycVerification(mockControl, {}));

    // Expect verified states to match successful query data
    expect(result.current.isBusinessPanVerified).toBe(true);
    expect(result.current.isGstinVerified).toBe(true);
  });

  it('should indicate verifying: true when a query is loading', () => {
    (useWatch as jest.Mock).mockImplementation(({ name }) => {
      if (name === 'businessPan') return 'ABCDE1234F';
      return '';
    });

    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey.includes('businessPan')) {
        return {
          data: undefined,
          isLoading: true,
          isFetching: true,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
      };
    });

    const { result } = renderHook(() => useKycVerification(mockControl, {}));

    expect(result.current.isBusinessPanVerifying).toBe(true);
    expect(result.current.isBusinessPanVerified).toBe(false);
  });
});
