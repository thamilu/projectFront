// ============================================================
// __tests__/unit/components/users/FormField.test.tsx
// Priority: a read-only, IdP-managed field (e.g. email) must never be
// labeled "(Optional)" — that implies the user could choose to fill it
// in here but hasn't, when in fact they can't edit it here at all.
// ============================================================

import { render, screen } from '@testing-library/react';
import { FormField } from '@/shared/ui/molecules/FormField';

function baseRegistration() {
  return { name: 'field', onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() };
}

describe('FormField — required/optional/read-only label', () => {
  it('shows a required marker and no (Optional)/(Read-only) text when required', () => {
    render(<FormField id="phone" label="Phone Number" required registration={baseRegistration()} />);

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.queryByText('(Optional)')).not.toBeInTheDocument();
    expect(screen.queryByText('(Read-only)')).not.toBeInTheDocument();
  });

  it('shows (Optional) for a normal, editable, non-required field', () => {
    render(<FormField id="altPhone" label="Alternate Phone" registration={baseRegistration()} />);

    expect(screen.getByText('(Optional)')).toBeInTheDocument();
    expect(screen.queryByText('(Read-only)')).not.toBeInTheDocument();
  });

  it('shows (Read-only), not (Optional), for a read-only field even though it is not required', () => {
    render(
      <FormField
        id="email"
        label="Email Address"
        readOnly
        disabled
        registration={baseRegistration()}
      />
    );

    expect(screen.getByText('(Read-only)')).toBeInTheDocument();
    expect(screen.queryByText('(Optional)')).not.toBeInTheDocument();
  });
});

describe('FormField — aria-describedby', () => {
  // Regression: a caller-supplied aria-describedby previously overwrote
  // FormField's own internally-computed value via the {...props} spread,
  // most visibly severing the link to helperText once a field had no error
  // (aria-describedby={hasError ? errorId : undefined} at real call sites
  // evaluated to `undefined` the moment the field became valid) — screen
  // reader users lost the helper guidance sighted users could still see.

  it('links to the helper text description when there is no error', () => {
    render(
      <FormField
        id="firstName"
        label="First Name"
        registration={baseRegistration()}
        helperText="Required. Max 100 characters."
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'firstName-description');
    expect(screen.getByText('Required. Max 100 characters.')).toHaveAttribute(
      'id',
      'firstName-description'
    );
  });

  it('links to the error message, not the helper text, once the field has an error', () => {
    render(
      <FormField
        id="firstName"
        label="First Name"
        registration={baseRegistration()}
        helperText="Required. Max 100 characters."
        error="First name is required."
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'firstName-error');
  });

  it('does not let a caller-supplied aria-describedby silently drop the helper-text association', () => {
    render(
      <FormField
        id="firstName"
        label="First Name"
        registration={baseRegistration()}
        helperText="Required. Max 100 characters."
        aria-describedby={undefined}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'firstName-description');
  });

  it('merges a caller-supplied aria-describedby with its own computed id rather than replacing it', () => {
    render(
      <FormField
        id="firstName"
        label="First Name"
        registration={baseRegistration()}
        helperText="Required. Max 100 characters."
        aria-describedby="external-hint"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-describedby')).toBe('external-hint firstName-description');
  });
});
