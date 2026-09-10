/**
 * @fileoverview Slider Component — Functional Unit Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Slider, SliderField } from '@/shared/ui/atoms/slider';

// Mock ResizeObserver for Radix UI Slider in JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Slider — Primitive', () => {
  it('renders without crashing', () => {
    render(<Slider value={[50]} min={0} max={100} aria-label="Test Slider" />);
    // Radix UI Slider thumbs have role="slider"
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('has displayName "Slider"', () => {
    expect(Slider.displayName).toBe('Slider');
  });

  it('renders correct number of thumbs for single value', () => {
    render(<Slider value={[50]} min={0} max={100} aria-label="Single Slider" />);
    expect(screen.getAllByRole('slider')).toHaveLength(1);
  });

  it('renders correct number of thumbs for multi-value (range)', () => {
    render(<Slider value={[20, 80]} min={0} max={100} aria-label="Range Slider" />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('passes proper accessibility properties to the slider thumb(s)', () => {
    render(<Slider value={[35]} min={10} max={50} aria-label="A11y Slider" />);
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAttribute('aria-valuenow', '35');
    expect(thumb).toHaveAttribute('aria-valuemin', '10');
    expect(thumb).toHaveAttribute('aria-valuemax', '50');
  });

  it('is disabled when disabled={true}', () => {
    render(<Slider value={[50]} disabled aria-label="Disabled Slider" />);
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAttribute('data-disabled');
    expect(thumb).not.toHaveAttribute('tabindex');
  });
});

describe('Slider — Size Variants', () => {
  const sizeClassMap = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  } as const;

  Object.entries(sizeClassMap).forEach(([size, expectedClass]) => {
    it(`applies correct class for size="${size}"`, () => {
      const { container } = render(
        <Slider value={[50]} size={size as keyof typeof sizeClassMap} aria-label="Size Test" />
      );
      // The Root element has the sliderVariants classes applied
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });
});

describe('SliderField', () => {
  it('has displayName "SliderField"', () => {
    expect(SliderField.displayName).toBe('SliderField');
  });

  it('renders label text', () => {
    render(<SliderField label="Volume Level" defaultValue={[50]} />);
    expect(screen.getByText('Volume Level')).toBeInTheDocument();
  });

  it('associates label with slider root via htmlFor/id', () => {
    render(<SliderField label="Volume Level" id="test-slider" defaultValue={[50]} />);
    const label = screen.getByText('Volume Level');
    expect(label).toHaveAttribute('for');
  });

  it('shows value display with default formatter', () => {
    render(<SliderField label="Volume" defaultValue={[45]} showValue />);
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('shows range value display with default formatter', () => {
    render(<SliderField label="Price" defaultValue={[20, 80]} showValue />);
    expect(screen.getByText('20 - 80')).toBeInTheDocument();
  });

  it('uses custom formatValue if provided', () => {
    const formatValue = jest.fn((val: number[]) => `$${val[0]}.00`);
    render(<SliderField label="Price" defaultValue={[25]} formatValue={formatValue} showValue />);
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(formatValue).toHaveBeenCalledWith([25]);
  });

  it('renders helper description text', () => {
    render(
      <SliderField label="Volume" defaultValue={[50]} description="This is custom helper text." />
    );
    expect(screen.getByText('This is custom helper text.')).toBeInTheDocument();
  });

  it('shows error message and sets aria-invalid when errorMessage is provided', () => {
    render(
      <SliderField label="Volume" defaultValue={[50]} errorMessage="Invalid value selected" />
    );
    expect(screen.getByText('Invalid value selected')).toBeInTheDocument();
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-invalid', 'true');
  });
});
