/**
 * @fileoverview Slider Component — Accessibility Tests
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import 'jest-axe/extend-expect';

import { SliderField } from '@/shared/ui/atoms/slider';

// Mock ResizeObserver for Radix UI Slider in JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

expect.extend(toHaveNoViolations);

describe('Slider — Accessibility Scan', () => {
  it('has no accessibility violations in default state', async () => {
    const { container } = render(
      <div>
        <SliderField label="Volume Level" defaultValue={[50]} description="Adjust sound volume" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations in range slider state', async () => {
    const { container } = render(
      <div>
        <SliderField
          label="Price filter"
          defaultValue={[20, 80]}
          min={0}
          max={100}
          formatValue={(val) => `$${val[0]} - $${val[1]}`}
        />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations in error state', async () => {
    const { container } = render(
      <div>
        <SliderField
          label="Speed limit"
          defaultValue={[120]}
          min={0}
          max={160}
          error={true}
          errorMessage="Value exceeds the threshold limit"
        />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations in disabled state', async () => {
    const { container } = render(
      <div>
        <SliderField label="Brightness" defaultValue={[70]} disabled />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
