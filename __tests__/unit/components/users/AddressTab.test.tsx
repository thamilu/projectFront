import { render, screen } from '@testing-library/react';
import { AddressTab } from '@/features/users/components/tabs/AddressTab';
import type { SharedActions } from '@/features/users/types/profile.types';

// Mock AddressFields to keep unit test isolated and fast
jest.mock('@/shared/ui/molecules/AddressFields', () => ({
  AddressFields: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="address-fields" data-disabled={disabled}>
      Mock Address Fields
    </div>
  ),
}));

const mockActions: SharedActions = {
  isEditing: false,
  isDirty: false,
  isSubmitting: false,
  onEdit: jest.fn(),
  onCancel: jest.fn(),
  onReset: jest.fn(),
  onSave: jest.fn(),
  onNext: jest.fn(),
  onBack: jest.fn(),
};

describe('AddressTab Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders AddressFields component and disabled state correctly when not editing', () => {
    render(<AddressTab actions={mockActions} hasNext hasBack />);

    const addressFields = screen.getByTestId('address-fields');
    expect(addressFields).toBeInTheDocument();
    expect(addressFields.getAttribute('data-disabled')).toBe('true');
  });

  it('renders AddressFields component and enables fields when editing', () => {
    const editActions = {
      ...mockActions,
      isEditing: true,
    };

    render(<AddressTab actions={editActions} hasNext hasBack />);

    const addressFields = screen.getByTestId('address-fields');
    expect(addressFields).toBeInTheDocument();
    expect(addressFields.getAttribute('data-disabled')).toBe('false');
  });

  it('correctly forwards hasNext/hasBack props to TabContainer', () => {
    const editActions = {
      ...mockActions,
      isEditing: true,
      isDirty: false,
    };

    render(<AddressTab actions={editActions} hasNext={true} hasBack={false} />);

    // Next Step button should be visible because hasNext=true
    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();

    // Previous Step button should NOT render because hasBack=false
    expect(screen.queryByRole('button', { name: /previous step/i })).not.toBeInTheDocument();
  });
});
