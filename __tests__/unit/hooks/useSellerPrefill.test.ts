import { renderHook, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/core/client';
import { sellerApi } from '@/features/seller/api/seller-api';
import { useSellerPrefill, PREFILL_FIELDS } from '@/features/seller/hooks/useSellerPrefill';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

// Deliberately NOT importing DEFAULT_SELLER_FORM_VALUES from
// '@/features/seller/hooks/useSellerForm' here — that module transitively
// imports features/auth/hooks/use-auth.tsx -> next-auth/react, which ships
// pure ESM that Jest's default (non-Babel) ts-jest transform cannot parse
// (see the same issue documented in auth.ts's own header comment). A
// minimal local defaults object avoids pulling in that chain; this hook
// doesn't use a resolver, so RHF doesn't require every schema field here.
const MINIMAL_DEFAULTS: Partial<SellerOnboardingValues> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

jest.mock('@/core/client', () => ({
  apiClient: { get: jest.fn() },
}));

jest.mock('@/features/seller/api/seller-api', () => ({
  sellerApi: { getMyProfile: jest.fn() },
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockGet = apiClient.get as jest.Mock;
const mockGetMyProfile = sellerApi.getMyProfile as jest.Mock;

function setup(user: Parameters<typeof useSellerPrefill>[0]['user'], isActive = true) {
  return renderHook(() => {
    const methods = useForm<SellerOnboardingValues>({
      defaultValues: MINIMAL_DEFAULTS as SellerOnboardingValues,
    });
    useSellerPrefill({ user, methods, isActive });
    return methods;
  });
}

describe('useSellerPrefill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Both profile calls resolve to "nothing found" by default — individual
    // tests override with mockResolvedValueOnce where they need real data.
    mockGet.mockResolvedValue({ data: {} });
    mockGetMyProfile.mockResolvedValue(null);
  });

  it('does nothing when there is no user', async () => {
    const { result } = setup(null);
    await waitFor(() => expect(mockGet).not.toHaveBeenCalled());
    expect(result.current.getValues().firstName).toBe('');
  });

  it('does nothing while inactive, even with a user', async () => {
    setup({ firstName: 'Ann', lastName: 'Lee', email: 'ann@example.com' }, false);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockGet).not.toHaveBeenCalled();
  });

  // Regression test for the real bug fixed this session: an empty-string
  // session firstName/lastName (the normal shape when Keycloak claims lack
  // a name — see lib/auth/handlers.ts) must fall through to splitting
  // `user.name`, not get stuck on '' because `??` doesn't treat '' as
  // missing the way `||` does.
  it('falls back to splitting user.name when session firstName/lastName are empty strings, not null', async () => {
    const { result } = setup({
      firstName: '', // empty string, NOT undefined — this is the shape that broke `??`
      lastName: '',
      name: 'Priya Sharma',
      email: 'priya@example.com',
    });

    await waitFor(() => {
      expect(result.current.getValues().firstName).toBe('Priya');
    });
    expect(result.current.getValues().lastName).toBe('Sharma');
  });

  it('prefers the session firstName/lastName over splitting user.name when both are present', async () => {
    const { result } = setup({
      firstName: 'Priya',
      lastName: 'S',
      name: 'Some Other Name',
      email: 'priya@example.com',
    });

    await waitFor(() => {
      expect(result.current.getValues().firstName).toBe('Priya');
    });
    expect(result.current.getValues().lastName).toBe('S');
  });

  it('merges real profile data over the session defaults once the profile fetch resolves', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          firstName: 'RealFirst',
          lastName: 'RealLast',
          email: 'real@example.com',
          city: 'Chennai',
          state: 'Tamil Nadu',
        },
      },
    });

    const { result } = setup({ firstName: '', lastName: '', name: 'Session Name', email: 'session@example.com' });

    await waitFor(() => {
      expect(result.current.getValues().firstName).toBe('RealFirst');
    });
    expect(result.current.getValues().city).toBe('Chennai');
    expect(result.current.getValues().state).toBe('Tamil Nadu');
  });

  it('does not let a failed profile fetch clobber the session-derived defaults', async () => {
    mockGet.mockRejectedValueOnce(new Error('network down'));
    mockGetMyProfile.mockRejectedValueOnce(new Error('network down'));

    const { result } = setup({ firstName: '', lastName: '', name: 'Fallback Name', email: 'fallback@example.com' });

    await waitFor(() => {
      expect(result.current.getValues().firstName).toBe('Fallback');
    });
    expect(result.current.getValues().lastName).toBe('Name');
  });

  it('only attempts the prefill once per mount, even if effect dependencies re-fire', async () => {
    const user = { firstName: 'Once', lastName: 'Only', email: 'once@example.com' };
    const { result, rerender } = setup(user);

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    rerender();
    rerender();

    await new Promise((r) => setTimeout(r, 0));
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result.current.getValues().firstName).toBe('Once');
  });

  it('PREFILL_FIELDS matches every key extractUserProfileFields actually populates', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          firstName: 'A',
          lastName: 'B',
          email: 'a@b.com',
          phone: '9999999999',
          alternatePhone: '8888888888',
          preferredLanguage: 'en',
          gender: 'female',
          dateOfBirth: '1990-01-01',
          addressLine1: 'Line 1',
          addressLine2: 'Line 2',
          city: 'City',
          district: 'District',
          taluk: 'Taluk',
          state: 'State',
          pincode: '600001',
          country: 'India',
        },
      },
    });

    const { result } = setup({ firstName: '', lastName: '', email: '' });

    await waitFor(() => expect(result.current.getValues().firstName).toBe('A'));

    // Every field the real profile response supplied must be one this hook
    // module publicly declares as profile-sourced — otherwise a future
    // consumer relying on PREFILL_FIELDS (see SellerRoleUpgradeForm's
    // "Start Fresh" handler) would silently treat real profile data as
    // discardable draft data.
    const populatedKeys: (keyof SellerOnboardingValues)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'alternatePhone',
      'preferredLanguage',
      'gender',
      'dateOfBirth',
      'addressLine1',
      'addressLine2',
      'city',
      'district',
      'taluk',
      'state',
      'pincode',
      'country',
    ];
    for (const key of populatedKeys) {
      expect(PREFILL_FIELDS).toContain(key);
    }
  });
});
