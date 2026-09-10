import { renderHook, act } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { useEditableStepValidation } from '@/features/seller/hooks/useEditableStepValidation';

// Mock useFormContext from react-hook-form
jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useFormContext: jest.fn(),
}));

describe('useEditableStepValidation', () => {
  const mockTrigger = jest.fn();
  const setIsEditing = jest.fn();
  const onValidationError = jest.fn();
  const fieldNames = ['field1', 'field2'] as const;

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      trigger: mockTrigger,
    });
  });

  it('initializes with default states', () => {
    const { result } = renderHook(() =>
      useEditableStepValidation({
        isEditing: false,
        setIsEditing,
        fieldNames,
      })
    );

    expect(result.current.isValidating).toBe(false);
    expect(result.current.hasToggled).toBe(false);
    expect(result.current.isSaved).toBe(false);
    expect(result.current.saveError).toBeNull();
  });

  it('toggles to edit mode without validation when isEditing is false', async () => {
    const { result } = renderHook(() =>
      useEditableStepValidation({
        isEditing: false,
        setIsEditing,
        fieldNames,
      })
    );

    await act(async () => {
      await result.current.handleToggleEdit();
    });

    expect(setIsEditing).toHaveBeenCalledWith(true);
    expect(mockTrigger).not.toHaveBeenCalled();
    expect(result.current.hasToggled).toBe(true);
    expect(result.current.isSaved).toBe(false);
    expect(result.current.saveError).toBeNull();
  });

  it('validates fields and locks when isEditing is true and validation passes', async () => {
    mockTrigger.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useEditableStepValidation({
        isEditing: true,
        setIsEditing,
        fieldNames,
      })
    );

    await act(async () => {
      await result.current.handleToggleEdit();
    });

    expect(mockTrigger).toHaveBeenCalledWith(fieldNames);
    expect(setIsEditing).toHaveBeenCalledWith(false);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isSaved).toBe(true);
    expect(result.current.saveError).toBeNull();
  });

  it('does not lock edit mode when validation fails', async () => {
    mockTrigger.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useEditableStepValidation({
        isEditing: true,
        setIsEditing,
        fieldNames,
      })
    );

    await act(async () => {
      await result.current.handleToggleEdit();
    });

    expect(mockTrigger).toHaveBeenCalledWith(fieldNames);
    expect(setIsEditing).not.toHaveBeenCalled();
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isSaved).toBe(false);
    expect(result.current.saveError).toBe('Validation failed. Please check the fields below.');
  });

  it('handles validation errors gracefully', async () => {
    const error = new Error('Test validation error');
    mockTrigger.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useEditableStepValidation({
        isEditing: true,
        setIsEditing,
        fieldNames,
        onValidationError,
      })
    );

    await act(async () => {
      await result.current.handleToggleEdit();
    });

    expect(onValidationError).toHaveBeenCalledWith(error);
    expect(setIsEditing).not.toHaveBeenCalled();
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isSaved).toBe(false);
    expect(result.current.saveError).toContain('Validation failed: Test validation error');
  });
});
