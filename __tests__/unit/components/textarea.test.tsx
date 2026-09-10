import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/shared/ui/atoms/textarea';

describe('Textarea Component - Functional Tests', () => {
  // Helper to render Textarea with standard props
  const renderTextarea = (props = {}) => {
    return render(
      <Textarea
        id="test-textarea"
        label="Test Description"
        data-testid="textarea-element"
        {...props}
      />
    );
  };

  describe('Rendering & Basic Props', () => {
    it('renders the textarea element', () => {
      renderTextarea();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder text', () => {
      renderTextarea({ placeholder: 'Enter details...' });
      expect(screen.getByPlaceholderText('Enter details...')).toBeInTheDocument();
    });

    it('renders with label and shows required marker when isRequired is true', () => {
      renderTextarea({ isRequired: true });
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does not render label when label prop is absent', () => {
      render(<Textarea data-testid="textarea-no-label" />);
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('States (Disabled, ReadOnly, Loading)', () => {
    it('is disabled when disabled prop is true', () => {
      renderTextarea({ disabled: true });
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('is disabled and shows wait cursor/aria-busy when isLoading is true', () => {
      renderTextarea({ isLoading: true });
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveAttribute('aria-busy', 'true');
      expect(textarea).toHaveClass('cursor-wait');
    });

    it('is readOnly when readOnly is true', () => {
      renderTextarea({ readOnly: true });
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('is readOnly when isReadOnly custom prop is true', () => {
      renderTextarea({ isReadOnly: true });
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('Character Count & Max Length', () => {
    it('renders character count when showCharCount and maxLength are provided', () => {
      renderTextarea({ showCharCount: true, maxLength: 100 });
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('updates character count when typing in uncontrolled mode', async () => {
      const user = userEvent.setup();
      renderTextarea({ showCharCount: true, maxLength: 100 });
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello World');
      expect(screen.getByText('11/100')).toBeInTheDocument();
    });

    it('updates character count based on value in controlled mode', () => {
      const { rerender } = render(
        <Textarea
          id="test-textarea"
          showCharCount
          maxLength={100}
          value="Initial value"
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('13/100')).toBeInTheDocument();

      rerender(
        <Textarea
          id="test-textarea"
          showCharCount
          maxLength={100}
          value="New value!"
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('10/100')).toBeInTheDocument();
    });

    it('applies warning class when remaining characters threshold is passed (>=80%)', async () => {
      const user = userEvent.setup();
      renderTextarea({ showCharCount: true, maxLength: 10 });
      const textarea = screen.getByRole('textbox');

      // 8 chars = 80%, should apply warning color class
      await user.type(textarea, '12345678');
      const countBadge = screen.getByText('8/10');
      expect(countBadge).toHaveClass('text-warning');
    });

    it('applies danger class when remaining characters threshold is passed (>=95%)', async () => {
      const user = userEvent.setup();
      renderTextarea({ showCharCount: true, maxLength: 10 });
      const textarea = screen.getByRole('textbox');

      // 10 chars = 100%, should apply danger color class
      await user.type(textarea, '1234567890');
      const countBadge = screen.getByText('10/10');
      expect(countBadge).toHaveClass('text-destructive');
      expect(countBadge).toHaveClass('font-semibold');
    });
  });

  describe('Validation & Error Handling', () => {
    it('renders error message when error prop is provided', () => {
      renderTextarea({ error: 'This field has an error' });
      expect(screen.getByText('This field has an error')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies validationState specific styles', () => {
      const { rerender } = render(<Textarea id="textarea-validation" validationState="invalid" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-destructive');

      rerender(<Textarea id="textarea-validation" validationState="valid" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-success');
    });

    it('renders hint message when hint prop is provided', () => {
      renderTextarea({ hint: 'Min 5 characters' });
      expect(screen.getByText('Min 5 characters')).toBeInTheDocument();
    });

    it('prioritizes error over hint when both are provided', () => {
      renderTextarea({ hint: 'Min 5 characters', error: 'Error occurred' });
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Min 5 characters')).not.toBeInTheDocument();
    });
  });

  describe('Ref Forwarding & Auto-Resize', () => {
    it('correctly forwards ref to the underlying element', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} id="ref-textarea" />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current?.id).toBe('ref-textarea');
    });

    it('correctly forwards functional ref to the underlying element', () => {
      const refFn = jest.fn();
      render(<Textarea ref={refFn} id="ref-textarea-fn" />);
      expect(refFn).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
    });

    it('applies resize styling based on resize prop', () => {
      const { rerender } = render(<Textarea id="resize-textarea" resize="none" />);
      expect(screen.getByRole('textbox')).toHaveClass('resize-none');

      rerender(<Textarea id="resize-textarea" resize="vertical" />);
      expect(screen.getByRole('textbox')).toHaveClass('resize-y');
    });

    it('triggers height adjustment when autoResize is enabled', async () => {
      const user = userEvent.setup();

      // Mock scrollHeight
      const originalScrollHeight = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'scrollHeight'
      );

      let heightAdjusted = false;
      Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
        configurable: true,
        get() {
          heightAdjusted = true;
          return 200;
        },
      });

      renderTextarea({ autoResize: true });
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'T');
      expect(heightAdjusted).toBe(true);

      // Restore prototype descriptor
      if (originalScrollHeight) {
        Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', originalScrollHeight);
      } else {
        delete (HTMLTextAreaElement.prototype as any).scrollHeight;
      }
    });
  });
});
