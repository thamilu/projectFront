/**
 * Shop handle field: error ownership and accessibility.
 *
 * The availability check itself is covered by
 * `__tests__/unit/hooks/use-handle-availability.test.ts`. This file mocks that
 * hook and tests only what the component adds on top — which is where two
 * further defects lived:
 *
 * 1. `clearErrors('shopHandle')` fired on every successful check and on every
 *    value under three characters, wiping whatever error was on the field —
 *    including the schema's own messages. "Handle must be at least 3
 *    characters" could therefore never be displayed.
 * 2. The result was communicated by border colour and icon only: a WCAG 1.4.1
 *    failure, and nothing at all for a screen-reader user.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider, type FieldErrors } from 'react-hook-form';
import { StoreDetailsFields } from '@/features/seller/components/StoreDetailsFields';
import type { StoreStepFormValues } from '@/features/seller/components/StoreDetailsFields';
import { useHandleAvailability } from '@/features/seller/hooks/use-handle-availability';
import type { HandleAvailabilityState } from '@/features/seller/hooks/use-handle-availability';

jest.mock('@/features/seller/hooks/use-handle-availability', () => ({
  useHandleAvailability: jest.fn(),
}));

// AddressFields fetches location data through react-query; not the subject here.
jest.mock('@/shared/ui/molecules/AddressFields', () => ({
  AddressFields: () => <div data-testid="address-fields" />,
}));

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const mockUseHandleAvailability = useHandleAvailability as jest.Mock;

function setAvailability(state: Partial<HandleAvailabilityState>) {
  mockUseHandleAvailability.mockReturnValue({
    status: 'IDLE',
    isChecking: false,
    message: null,
    ...state,
  });
}

const FIELD_SPECS = {
  storeName: { id: 'shopName' as const, label: 'Store name', placeholder: 'Acme' },
  description: { id: 'description' as const, label: 'Description', placeholder: 'About us' },
};

/**
 * Render inside a real `FormProvider`.
 *
 * A real form rather than a mocked context: the behaviour under test *is* the
 * interaction with React Hook Form's error store, so stubbing `setError` and
 * `clearErrors` would test the mock instead of the fix.
 */
function renderFields(errors: FieldErrors = {}) {
  const Wrapper = () => {
    const methods = useForm<StoreStepFormValues>({
      defaultValues: { shopName: 'Acme Store', shopHandle: 'ab', description: '' },
    });

    return (
      <FormProvider {...methods}>
        <StoreDetailsFields
          register={methods.register}
          errors={errors}
          storeName={FIELD_SPECS.storeName}
          description={FIELD_SPECS.description}
        />
      </FormProvider>
    );
  };

  return render(<Wrapper />);
}

beforeEach(() => {
  jest.clearAllMocks();
  setAvailability({});
});

describe('StoreDetailsFields — handle error ownership', () => {
  it('keeps a schema error visible while the availability check reports IDLE', () => {
    // Regression: `clearErrors('shopHandle')` ran unconditionally for any value
    // shorter than three characters, so this message was erased the moment it
    // was set and a seller never saw why the field was rejected.
    setAvailability({ status: 'IDLE' });

    renderFields({ shopHandle: { type: 'too_small', message: 'Handle must be at least 3 characters' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Handle must be at least 3 characters');
  });

  it('keeps a schema error visible even when the handle is reported AVAILABLE', () => {
    // The worse half of the same bug: a handle the schema rejects could be
    // shown with a green "available" tick, because the successful check wiped
    // the validation error.
    setAvailability({ status: 'AVAILABLE' });

    renderFields({
      shopHandle: { type: 'invalid_string', message: 'Only lowercase letters, numbers, and hyphens allowed' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only lowercase letters, numbers, and hyphens allowed'
    );
  });

  it('suppresses its own status text while a field error is displayed', () => {
    // Saying the same thing twice is noise, and the two would be read
    // consecutively by a screen reader.
    setAvailability({ status: 'TAKEN', message: 'This handle is already taken' });

    renderFields({ shopHandle: { type: 'handleUnavailable', message: 'This handle is already taken' } });

    expect(screen.getAllByText('This handle is already taken')).toHaveLength(1);
  });
});

describe('StoreDetailsFields — accessibility of the availability result', () => {
  it('announces availability as text, not only as a colour', () => {
    // WCAG 1.4.1: a green border and a tick icon convey nothing to a
    // screen-reader user, and nothing to a colour-blind one either.
    setAvailability({ status: 'AVAILABLE' });

    renderFields();

    expect(screen.getByRole('status')).toHaveTextContent('Handle is available');
  });

  it('explains an invalid handle instead of reporting a failed verification', () => {
    // The originally reported bug, seen from the UI: a `PathSegmentError` from
    // the URL builder surfaced as "we could not check this", hiding the fact
    // that the handle simply was not allowed.
    setAvailability({ status: 'INVALID', message: 'Only lowercase letters, numbers, and hyphens allowed' });

    renderFields();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Only lowercase letters, numbers, and hyphens allowed'
    );
  });

  it('makes clear that a failed check is not blocking', () => {
    setAvailability({ status: 'ERROR' });

    renderFields();

    expect(screen.getByRole('status')).toHaveTextContent(/you can continue/i);
  });

  it('exposes a live region that exists before it has anything to say', () => {
    // A region that mounts with its text already in place is announced
    // unreliably across AT/browser pairs; one that is already present and then
    // changes is not.
    setAvailability({ status: 'IDLE' });

    renderFields();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();
  });

  it('points the input at its status and hint through aria-describedby', () => {
    setAvailability({ status: 'TAKEN', message: 'This handle is already taken' });

    renderFields();

    const input = screen.getByLabelText(/shopHandle.label/i);
    const describedBy = input.getAttribute('aria-describedby')?.split(' ') ?? [];

    expect(describedBy).toContain('shopHandle-availability');
    expect(describedBy).toContain('shopHandle-hint');
  });

  it('lists the error first in aria-describedby, so it is heard first', () => {
    setAvailability({ status: 'IDLE' });

    renderFields({ shopHandle: { type: 'too_small', message: 'Handle must be at least 3 characters' } });

    const input = screen.getByLabelText(/shopHandle.label/i);

    expect(input.getAttribute('aria-describedby')?.split(' ')[0]).toBe('shopHandle-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('StoreDetailsFields — the field stays usable', () => {
  it('does not disable the input while a check is in flight', () => {
    // Regression: the input was disabled for the duration of every check. The
    // debounce fires 500ms after a keystroke, so a seller typing at normal
    // speed had the field taken away mid-word — losing focus and dropping the
    // characters typed during the request.
    setAvailability({ isChecking: true });

    renderFields();

    expect(screen.getByLabelText(/shopHandle.label/i)).not.toBeDisabled();
  });

  it('still honours an explicit disabled prop', () => {
    setAvailability({});

    const Wrapper = () => {
      const methods = useForm<StoreStepFormValues>({ defaultValues: { shopName: '', shopHandle: '', description: '' } });
      return (
        <FormProvider {...methods}>
          <StoreDetailsFields
            register={methods.register}
            errors={{}}
            storeName={FIELD_SPECS.storeName}
            description={FIELD_SPECS.description}
            disabled
          />
        </FormProvider>
      );
    };

    render(<Wrapper />);

    expect(screen.getByLabelText(/shopHandle.label/i)).toBeDisabled();
  });

  it('stops checking entirely when the form is disabled', () => {
    setAvailability({});

    const Wrapper = () => {
      const methods = useForm<StoreStepFormValues>({ defaultValues: { shopName: '', shopHandle: 'acme', description: '' } });
      return (
        <FormProvider {...methods}>
          <StoreDetailsFields
            register={methods.register}
            errors={{}}
            storeName={FIELD_SPECS.storeName}
            description={FIELD_SPECS.description}
            disabled
          />
        </FormProvider>
      );
    };

    render(<Wrapper />);

    expect(mockUseHandleAvailability).toHaveBeenCalledWith('acme', { enabled: false });
  });
});
