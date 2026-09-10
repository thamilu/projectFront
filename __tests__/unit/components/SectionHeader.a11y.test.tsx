import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import 'jest-axe/extend-expect';
import { SectionHeader } from '@/shared/ui/molecules/SectionHeader';

expect.extend(toHaveNoViolations);

describe('SectionHeader Component — WCAG 2.2 Axe Audit', () => {
  it('has no accessibility violations in default state', async () => {
    const { container } = render(
      <SectionHeader iconName="FileText" title="Tax Section" id="tax-header" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with all options configured', async () => {
    const { container } = render(
      <SectionHeader
        iconName="User"
        title="Identity Verification Details"
        id="identity-header"
        headingLevel="h2"
        iconSize="lg"
        tabIndex={-1}
        className="mt-6 font-semibold"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
