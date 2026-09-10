/**
 * @fileoverview Checkbox Component — Functional Unit Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, CheckboxField } from '@/shared/ui/atoms/checkbox';

describe('Checkbox — Primitive', () => {
  it('renders without crashing', () => {
    render(<Checkbox aria-label="Test checkbox" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('has displayName "Checkbox"', () => {
    expect(Checkbox.displayName).toBe('Checkbox');
  });

  it('is unchecked by default', () => {
    render(<Checkbox aria-label="Test" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders as checked when checked={true}', () => {
    render(<Checkbox aria-label="Test" checked={true} onCheckedChange={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('renders indeterminate state with mixed aria-checked', () => {
    render(
      <Checkbox aria-label="Select all" checked="indeterminate" onCheckedChange={jest.fn()} />
    );
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('can be toggled via keyboard Space key', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    render(<Checkbox aria-label="Toggle" checked={false} onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    await user.keyboard('[Space]');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('is not interactive when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    render(<Checkbox aria-label="Disabled" disabled onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('sets aria-invalid when error={true}', () => {
    render(<Checkbox aria-label="Terms" error={true} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Checkbox — Size Variants', () => {
  const sizeClassMap = {
    sm: 'h-3.5',
    md: 'h-4',
    lg: 'h-5',
    touch: 'h-6',
  } as const;

  Object.entries(sizeClassMap).forEach(([size, expectedClass]) => {
    it(`applies correct class for size="${size}"`, () => {
      const { container } = render(
        <Checkbox aria-label="Test" size={size as keyof typeof sizeClassMap} />
      );
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });
});

describe('CheckboxField', () => {
  it('renders label text', () => {
    render(<CheckboxField label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('associates label with checkbox via htmlFor/id', () => {
    render(<CheckboxField label="Accept terms" id="terms" />);
    const label = screen.getByText('Accept terms');
    const checkbox = screen.getByRole('checkbox');
    expect(label).toHaveAttribute('for', 'terms');
    expect(checkbox).toHaveAttribute('id', 'terms');
  });

  it('renders description text', () => {
    render(<CheckboxField label="Terms" description="Please read carefully before accepting." />);
    expect(screen.getByText('Please read carefully before accepting.')).toBeInTheDocument();
  });

  it('shows error message when error={true} and errorMessage provided', () => {
    render(<CheckboxField label="Terms" error={true} errorMessage="You must accept the terms." />);
    expect(screen.getByText('You must accept the terms.')).toBeInTheDocument();
  });
});
