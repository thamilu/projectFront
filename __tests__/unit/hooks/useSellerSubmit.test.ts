import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { sellerApi } from '@/features/seller/api/seller-api';
import { eventBus } from '@/platform/events';
import { mapApiErrorsToForm } from '@/features/seller/utils/form-error-mapper';
import { useSellerSubmit } from '@/features/seller/hooks/useSellerSubmit';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

jest.mock('@/features/seller/api/seller-api', () => ({
  sellerApi: { register: jest.fn() },
}));

jest.mock('@/platform/events', () => ({
  eventBus: { publish: jest.fn() },
}));

jest.mock('@/features/seller/utils/form-error-mapper', () => ({
  mapApiErrorsToForm: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockRegister = sellerApi.register as jest.Mock;
const mockPublish = eventBus.publish as jest.Mock;
const mockMapErrors = mapApiErrorsToForm as jest.Mock;

function setup() {
  const setStatus = jest.fn();
  const setErrorMessage = jest.fn();
  const setReferenceId = jest.fn();
  const onSuccess = jest.fn();

  const { result } = renderHook(() => {
    const methods = useForm<SellerOnboardingValues>({
      defaultValues: { shopName: 'My Shop' } as Partial<SellerOnboardingValues> as SellerOnboardingValues,
    });
    const submit = useSellerSubmit({ methods, setStatus, setErrorMessage, onSuccess, setReferenceId });
    return { methods, ...submit };
  });

  return { result, setStatus, setErrorMessage, setReferenceId, onSuccess };
}

describe('useSellerSubmit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits, marks PENDING, and derives a reference id from response.sellerId', async () => {
    mockRegister.mockResolvedValue({ sellerId: 42 });
    const { result, setStatus, setReferenceId, onSuccess } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(setStatus).toHaveBeenCalledWith('PENDING');
    expect(setReferenceId).toHaveBeenCalledWith('SEL-42');
    expect(toast.success).toHaveBeenCalledWith('Registration successful! Redirecting...');
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('falls back to response.seller.id when response.sellerId is absent', async () => {
    mockRegister.mockResolvedValue({ seller: { id: 7 } });
    const { result, setReferenceId } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(setReferenceId).toHaveBeenCalledWith('SEL-7');
  });

  it('publishes a SellerRegistered event with the numeric seller id and shop name', async () => {
    mockRegister.mockResolvedValue({ sellerId: 11 });
    const { result } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(mockPublish).toHaveBeenCalledWith('SellerRegistered', {
      sellerId: 11,
      shopName: 'My Shop',
    });
  });

  it('does not let a failing eventBus.publish stop the success flow', async () => {
    mockRegister.mockResolvedValue({ sellerId: 5 });
    mockPublish.mockImplementation(() => {
      throw new Error('bus down');
    });
    const { result, setStatus, onSuccess } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(setStatus).toHaveBeenCalledWith('PENDING');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('maps field-level API errors onto the form and does not set a global ERROR status', async () => {
    mockRegister.mockRejectedValue({
      errors: { panNumber: 'Invalid PAN format' },
    });
    const { result, setStatus } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(mockMapErrors).toHaveBeenCalledWith(
      { panNumber: 'Invalid PAN format' },
      expect.any(Function)
    );
    expect(toast.error).toHaveBeenCalledWith(
      'Registration failed: Please check the highlighted fields across all steps.'
    );
    expect(setStatus).not.toHaveBeenCalledWith('ERROR');
  });

  it('sets a global ERROR status with the server message for a non-field-level failure', async () => {
    mockRegister.mockRejectedValue({ message: 'Backend is unreachable' });
    const { result, setStatus, setErrorMessage } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(setStatus).toHaveBeenCalledWith('ERROR');
    expect(setErrorMessage).toHaveBeenCalledWith('Backend is unreachable');
    expect(toast.error).toHaveBeenCalledWith('Backend is unreachable');
  });

  it('falls back to a generic message when a non-field-level failure has none of its own', async () => {
    mockRegister.mockRejectedValue({});
    const { result, setErrorMessage } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(setErrorMessage).toHaveBeenCalledWith(
      'We could not process your registration. Please try again.'
    );
  });

  it('resets isSubmitting to false even when submission throws', async () => {
    mockRegister.mockRejectedValue({ message: 'boom' });
    const { result } = setup();

    await act(async () => {
      await result.current.onSubmit(result.current.methods.getValues());
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
