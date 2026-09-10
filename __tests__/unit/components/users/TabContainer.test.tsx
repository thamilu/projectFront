import { render, screen } from '@testing-library/react';
import { TabContainer } from '@/features/users/components/TabContainer';
import type { SharedActions } from '@/features/users/types/profile.types';

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

describe('TabContainer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <TabContainer actions={mockActions}>
        <div data-testid="test-child">Child Content</div>
      </TabContainer>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('does not render FormActions when not in edit mode', () => {
    render(
      <TabContainer actions={mockActions}>
        <div>Child Content</div>
      </TabContainer>
    );

    // The "Edit Profile" action now belongs to ProfileHeader, not TabContainer.
    // TabContainer should show NO action buttons when isEditing is false.
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('renders FormActions in edit mode and triggers action buttons', () => {
    const editActions = {
      ...mockActions,
      isEditing: true,
      isDirty: true,
    };

    render(
      <TabContainer actions={editActions} hasNext hasBack>
        <div>Child Content</div>
      </TabContainer>
    );

    // Cancel Button should be visible
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    cancelButton.click();
    expect(mockActions.onCancel).toHaveBeenCalledTimes(1);

    // Reset Button should be visible
    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toBeInTheDocument();
    resetButton.click();
    expect(mockActions.onReset).toHaveBeenCalledTimes(1);

    // Save Button should be visible
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeInTheDocument();
    saveButton.click();
    expect(mockActions.onSave).toHaveBeenCalledTimes(1);

    // Next Button should be visible
    const nextButton = screen.getByRole('button', { name: /next step/i });
    expect(nextButton).toBeInTheDocument();
    nextButton.click();
    expect(mockActions.onNext).toHaveBeenCalledTimes(1);

    // Back Button should be visible (aria-label="Previous Step")
    const backButton = screen.getByRole('button', { name: /previous step/i });
    expect(backButton).toBeInTheDocument();
    backButton.click();
    expect(mockActions.onBack).toHaveBeenCalledTimes(1);
  });
});
