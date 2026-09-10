import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiClient } from '@/core/client';
import { useProfileSubmit } from '@/features/users/hooks/useProfileSubmit';
import type { ProfileValues } from '@/shared/schemas/user.schema';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/core/client', () => ({
  apiClient: {
    put: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { error: jest.fn() },
}));

const mockPut = apiClient.put as jest.Mock;
const mockUseSession = useSession as jest.Mock;

function baseValues(overrides: Partial<ProfileValues> = {}): ProfileValues {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '',
    alternatePhone: '',
    preferredLanguage: '',
    gender: '',
    dateOfBirth: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    taluk: '',
    state: '',
    pincode: '',
    country: '',
    timezone: '',
    currency: '',
    locale: '',
    ...overrides,
  } as ProfileValues;
}

describe('useProfileSubmit', () => {
  const updateSession = jest.fn();
  const reset = jest.fn();
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: null, status: 'authenticated', update: updateSession });
  });

  // Regression: timezone/currency/locale are real profileSchema fields
  // (see LanguageFields.tsx) that were previously silently stripped from
  // the outgoing PUT payload because sanitizePayload's allowedKeys list
  // hadn't been updated to include them — the UI reported success while
  // discarding the user's change entirely.
  it('includes timezone, currency, and locale in the submitted payload', async () => {
    mockPut.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: false, reset, onSuccess })
    );

    await act(async () => {
      await result.current.submit(
        baseValues({ timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN' })
      );
    });

    expect(mockPut).toHaveBeenCalledTimes(1);
    const [, payload] = mockPut.mock.calls[0];
    expect(payload).toMatchObject({ timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN' });
  });

  it('strips empty-string fields from the payload', async () => {
    mockPut.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: false, reset, onSuccess })
    );

    await act(async () => {
      await result.current.submit(baseValues({ timezone: '' }));
    });

    const [, payload] = mockPut.mock.calls[0];
    expect(payload).not.toHaveProperty('timezone');
  });

  it('resolves on success and calls onSuccess/reset/toast', async () => {
    mockPut.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: false, reset, onSuccess })
    );

    await act(async () => {
      await result.current.submit(baseValues());
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  // Regression: submit() previously re-threw after already handling the
  // error (toast shown, error state set) — since ProfileForm's
  // handleFormSubmit has no try/catch around `await submit(data)`, and
  // react-hook-form's handleSubmit() doesn't catch what its onValid
  // callback throws, that produced an unhandled promise rejection on every
  // single failed save. submit() must resolve (not reject) once it has
  // already reported the error through its own state/toast.
  it('does not throw on failure — the error is surfaced via state/toast instead', async () => {
    mockPut.mockRejectedValue(new Error('Network down'));
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: false, reset, onSuccess })
    );

    let rejected = false;
    await act(async () => {
      try {
        await result.current.submit(baseValues());
      } catch {
        rejected = true;
      }
    });

    expect(rejected).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  // Regression: submit() previously called the bare `updateSession()` from
  // next-auth unconditionally and unguarded, right after the success toast.
  // If that (unrelated) session-refresh network call failed, execution fell
  // into the outer catch block and showed a contradictory "Unable to save
  // profile" error toast immediately after the success toast — even though
  // the actual profile PUT had already succeeded. Session refresh is now
  // solely ProfileForm's onSuccess callback's responsibility.
  it('reports success cleanly even when the NextAuth session cannot be refreshed', async () => {
    mockPut.mockResolvedValue({ data: {} });
    updateSession.mockRejectedValue(new Error('session refresh failed'));
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: false, reset, onSuccess })
    );

    await act(async () => {
      await result.current.submit(baseValues());
    });

    expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  // Regression: sanitizePayload previously filtered by emptiness alone, so
  // clearing a previously-set optional field (e.g. dateOfBirth's clear
  // button) omitted the key from the payload entirely instead of sending
  // '' to signal "clear this" — a partial-merge backend then kept the old
  // value while the UI still reported success.
  it('includes a field the user cleared (dirty) as an empty string, not omitted', async () => {
    mockPut.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: false, reset, onSuccess })
    );

    await act(async () => {
      await result.current.submit(baseValues({ dateOfBirth: '' }), { dateOfBirth: true });
    });

    const [, payload] = mockPut.mock.calls[0];
    expect(payload).toHaveProperty('dateOfBirth', '');
  });

  it('omits a field the user never touched, even though every field has some value', async () => {
    mockPut.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: false, reset, onSuccess })
    );

    await act(async () => {
      // firstName is dirty (the field actually edited); email is not, even
      // though it also has a value in `values` — dirtyFields is what scopes
      // the payload now, not presence/emptiness.
      await result.current.submit(baseValues({ firstName: 'Updated' }), { firstName: true });
    });

    const [, payload] = mockPut.mock.calls[0];
    expect(payload).toEqual({ firstName: 'Updated' });
    expect(payload).not.toHaveProperty('email');
  });

  it('submits to the seller profile endpoint when hasSellerProfile is true', async () => {
    mockPut.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useProfileSubmit({ hasSellerProfile: true, reset, onSuccess })
    );

    await act(async () => {
      await result.current.submit(baseValues());
    });

    const [endpoint] = mockPut.mock.calls[0];
    expect(endpoint).toMatch(/seller/i);
  });
});
