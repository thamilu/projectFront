import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import 'jest-axe/extend-expect';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/shared/ui/atoms/textarea';

expect.extend(toHaveNoViolations);

describe('Textarea Component - Accessibility Tests', () => {
  const renderTextarea = (props = {}) => {
    return render(
      <Textarea id="test-textarea" label="Test Description" data-testid="textarea" {...props} />
    );
  };

  it('should have no accessibility violations in default state', async () => {
    const { container } = renderTextarea();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in error state', async () => {
    const { container } = renderTextarea({
      error: 'This field is required',
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations when disabled', async () => {
    const { container } = renderTextarea({
      disabled: true,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('links label to textarea via htmlFor and id attributes', () => {
    renderTextarea();
    const label = screen.getByText('Test Description');
    const textarea = screen.getByRole('textbox');

    expect(label).toHaveAttribute('for', 'test-textarea');
    expect(textarea).toHaveAttribute('id', 'test-textarea');
  });

  it('correctly associates aria-required attribute when required', () => {
    renderTextarea({ isRequired: true });
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveAttribute('aria-required', 'true');
  });

  it('correctly associates aria-invalid attribute when error is present', () => {
    renderTextarea({ error: 'Validation error' });
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('connects helper/error messages via aria-describedby', () => {
    const { rerender } = render(
      <Textarea id="test-textarea-desc" label="Description" hint="Please fill this" />
    );
    let textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-desc-hint');

    rerender(<Textarea id="test-textarea-desc" label="Description" error="Something went wrong" />);
    textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-desc-error');
  });

  it('is keyboard focusable in default state', async () => {
    const user = userEvent.setup();
    renderTextarea();
    const textarea = screen.getByRole('textbox');

    await user.tab();
    expect(textarea).toHaveFocus();
  });

  it('is not keyboard focusable when disabled', async () => {
    const user = userEvent.setup();
    renderTextarea({ disabled: true });

    await user.tab();
    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });
});
