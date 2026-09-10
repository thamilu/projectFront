// ============================================================
// __tests__/unit/components/users/FormActions.test.tsx
// Priority: the "Next" action must say specifically where it goes
// ("Continue to Address") rather than a generic "Next Step" that leaves
// the user guessing — falling back to the generic label only when the
// caller genuinely has no destination to name.
// ============================================================

import { render, screen } from '@testing-library/react';
import { FormActions } from '@/shared/ui/molecules/FormActions';

function baseProps() {
  return {
    isEditing: true,
    isDirty: false,
    isSubmitting: false,
    onEdit: jest.fn(),
    onCancel: jest.fn(),
    onReset: jest.fn(),
    onSave: jest.fn(),
    onNext: jest.fn(),
    onBack: jest.fn(),
  };
}

describe('FormActions', () => {
  it('renders nothing outside edit mode', () => {
    const { container } = render(<FormActions {...baseProps()} isEditing={false} hasNext />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a specific "Continue to X" label when nextTabLabel is provided', () => {
    render(<FormActions {...baseProps()} hasNext nextTabLabel="Address" />);

    expect(screen.getByRole('button', { name: /continue to address/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^next step$/i })).not.toBeInTheDocument();
  });

  it('falls back to the generic "Next Step" label when nextTabLabel is not provided', () => {
    render(<FormActions {...baseProps()} hasNext />);

    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
  });

  it('does not render a next button when hasNext is false', () => {
    render(<FormActions {...baseProps()} hasNext={false} nextTabLabel="Address" />);

    expect(screen.queryByRole('button', { name: /continue to address/i })).not.toBeInTheDocument();
  });
});
