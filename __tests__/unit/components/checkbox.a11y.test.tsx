/**
 * @fileoverview Checkbox Component — Accessibility Tests
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import 'jest-axe/extend-expect';

import { CheckboxField } from '@/shared/ui/atoms/checkbox';

expect.extend(toHaveNoViolations);

describe('Checkbox — Accessibility Scan', () => {
  it('has no accessibility violations in default state', async () => {
    const { container } = render(
      <div>
        <CheckboxField label="Accept terms" description="Privacy policy description" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations in error state', async () => {
    const { container } = render(
      <div>
        <CheckboxField label="Accept terms" error={true} errorMessage="Required field" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations in disabled state', async () => {
    const { container } = render(
      <div>
        <CheckboxField label="Accept terms" disabled />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
