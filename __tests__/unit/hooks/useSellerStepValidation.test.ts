import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSellerStepValidation } from '@/features/seller/hooks/useSellerStepValidation';
import { getFieldsForStep, findFirstErrorStep } from '@/features/seller/utils/seller-field-map';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

jest.mock('@/features/seller/utils/seller-field-map', () => ({
  getFieldsForStep: jest.fn(),
  findFirstErrorStep: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() },
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockGetFieldsForStep = getFieldsForStep as jest.Mock;
const mockFindFirstErrorStep = findFirstErrorStep as jest.Mock;

function setup({
  stepsCount = 3,
  onSubmit = jest.fn(),
}: { stepsCount?: number; onSubmit?: jest.Mock } = {}) {
  return renderHook(() => {
    const methods = useForm<SellerOnboardingValues>({
      defaultValues: { firstName: '', email: '' } as Partial<SellerOnboardingValues> as SellerOnboardingValues,
    });
    const validation = useSellerStepValidation({ methods, onSubmit, stepsCount });
    return { methods, ...validation };
  });
}

describe('useSellerStepValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFieldsForStep.mockReturnValue(['firstName']);
  });

  it('starts on step 0', () => {
    const { result } = setup();
    expect(result.current.currentStep).toBe(0);
  });

  it('advances to the next step when the current step is valid', async () => {
    const { result } = setup({ stepsCount: 3 });
    // Give the field a value that will pass trigger() (no resolver/rules registered => always valid)
    await act(async () => {
      await result.current.next();
    });
    expect(result.current.currentStep).toBe(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does not advance and shows an error toast when the current step is invalid', async () => {
    const { result } = setup({ stepsCount: 3 });
    // Force trigger() to report invalid by registering a field with a failing rule
    act(() => {
      result.current.methods.setError('firstName', { type: 'required', message: 'Required' });
    });
    // trigger() re-validates and would normally clear a manually-set error for
    // an unregistered field with no rules, so instead assert on the toast
    // path by making the field genuinely required via a resolver-less manual
    // trigger override.
    jest.spyOn(result.current.methods, 'trigger').mockResolvedValueOnce(false);

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.currentStep).toBe(0);
    expect(toast.error).toHaveBeenCalledWith('Please fix the errors in this step before proceeding.');
  });

  it('prev() steps back but never below 0', () => {
    const { result } = setup({ stepsCount: 3 });
    act(() => result.current.prev());
    expect(result.current.currentStep).toBe(0);
  });

  it('prev() decrements after advancing', async () => {
    const { result } = setup({ stepsCount: 3 });
    await act(async () => {
      await result.current.next();
    });
    expect(result.current.currentStep).toBe(1);
    act(() => result.current.prev());
    expect(result.current.currentStep).toBe(0);
  });

  it('calls onSubmit with form values when the final step passes full-form validation', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = setup({ stepsCount: 1, onSubmit });

    await act(async () => {
      await result.current.next();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ firstName: '' });
  });

  it('does not call onSubmit and jumps to the first error step when final full-form validation fails', async () => {
    const onSubmit = jest.fn();
    const { result } = setup({ stepsCount: 1, onSubmit });

    jest.spyOn(result.current.methods, 'trigger')
      // First call: per-step trigger for the (only) current step -> valid
      .mockResolvedValueOnce(true)
      // Second call: full-form trigger() at the final-step check -> invalid
      .mockResolvedValueOnce(false);
    mockFindFirstErrorStep.mockReturnValue(0);

    await act(async () => {
      await result.current.next();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.currentStep).toBe(0);
    expect(toast.error).toHaveBeenCalledWith('Please review Step 1 for errors.');
  });

  it('shows a generic error toast when full-form validation fails and no specific error step is found', async () => {
    const onSubmit = jest.fn();
    const { result } = setup({ stepsCount: 1, onSubmit });

    jest.spyOn(result.current.methods, 'trigger')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockFindFirstErrorStep.mockReturnValue(-1);

    await act(async () => {
      await result.current.next();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Please check all steps for missing or incorrect information.');
  });
});
