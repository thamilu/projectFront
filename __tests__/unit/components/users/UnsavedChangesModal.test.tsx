import { render, screen, fireEvent } from '@testing-library/react';
import { UnsavedChangesModal } from '@/features/users/components/modals/UnsavedChangesModal';

describe('UnsavedChangesModal', () => {
  it('renders correctly when open', () => {
    render(
      <UnsavedChangesModal
        open={true}
        onOpenChange={jest.fn()}
        onConfirmDiscard={jest.fn()}
        onKeepEditing={jest.fn()}
      />
    );

    expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument();
    expect(
      screen.getByText(/You have unsaved changes to your profile/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep editing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard changes/i })).toBeInTheDocument();
  });

  it('triggers onKeepEditing callback', () => {
    const onKeepEditingMock = jest.fn();
    render(
      <UnsavedChangesModal
        open={true}
        onOpenChange={jest.fn()}
        onConfirmDiscard={jest.fn()}
        onKeepEditing={onKeepEditingMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /keep editing/i }));
    expect(onKeepEditingMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onConfirmDiscard callback', () => {
    const onConfirmDiscardMock = jest.fn();
    render(
      <UnsavedChangesModal
        open={true}
        onOpenChange={jest.fn()}
        onConfirmDiscard={onConfirmDiscardMock}
        onKeepEditing={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));
    expect(onConfirmDiscardMock).toHaveBeenCalledTimes(1);
  });
});
