/**
 * @fileoverview Icon Component — Accessibility Tests
 *
 * @description
 * WCAG 2.2 AA compliance verification using jest-axe.
 * Tests cover:
 * - Decorative mode (aria-hidden, no role)
 * - Informative mode (role="img", aria-label)
 * - Keyboard non-focusability
 * - Screen reader attribute correctness
 * - All registered icons for universal compliance
 *
 * Standards:
 * - WCAG 2.2 SC 1.1.1 Non-text Content
 * - WCAG 2.2 SC 4.1.2 Name, Role, Value
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import 'jest-axe/extend-expect';

import { Icon, Icons, type IconName } from '@/shared/ui/atoms/icons/Icon';

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations);

const ALL_ICON_NAMES = Object.keys(Icons) as IconName[];

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: Axe Automated Accessibility Scan
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — WCAG 2.2 Automated Axe Audit', () => {
  it('has no accessibility violations in decorative mode', async () => {
    const { container } = render(
      <div>
        {/* Decorative: icon next to visible text */}
        <button type="button">
          <Icon name="ShieldCheck" size="md" />
          <span>Secure</span>
        </button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations in informative mode', async () => {
    const { container } = render(
      <div>
        {/* Informative: standalone icon */}
        <button type="button" aria-label="Open user profile">
          <Icon name="User" size="md" label="User profile" />
        </button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it.each(ALL_ICON_NAMES)(
    'has no axe violations for icon "%s" in decorative mode',
    async (name) => {
      const { container } = render(
        <div>
          <Icon name={name} size="md" />
          <span>{name} icon</span>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  );

  it.each(ALL_ICON_NAMES)(
    'has no axe violations for icon "%s" in informative mode',
    async (name) => {
      const { container } = render(<Icon name={name} size="md" label={`${name} icon`} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Decorative Mode — ARIA Attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Decorative Mode (no label)', () => {
  it('sets aria-hidden="true" when label is not provided', () => {
    const { container } = render(<Icon name="ShieldCheck" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('does NOT set role when decorative', () => {
    const { container } = render(<Icon name="ShieldCheck" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('role');
  });

  it('does NOT set aria-label when decorative', () => {
    const { container } = render(<Icon name="ShieldCheck" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('aria-label');
  });

  it('is not announced by screen readers (aria-hidden removes from tree)', () => {
    const { container } = render(
      <div>
        <Icon name="User" />
        <span>User Profile</span>
      </div>
    );
    const svg = container.querySelector('svg');

    // aria-hidden="true" means screen readers skip this element
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Informative Mode — ARIA Attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Informative Mode (with label)', () => {
  const LABEL = 'Secure payment shield';

  it('sets role="img" when label is provided', () => {
    const { container } = render(<Icon name="ShieldCheck" label={LABEL} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
  });

  it('sets aria-label to the provided label text', () => {
    const { container } = render(<Icon name="ShieldCheck" label={LABEL} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label', LABEL);
  });

  it('does NOT set aria-hidden when informative', () => {
    const { container } = render(<Icon name="ShieldCheck" label={LABEL} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('aria-hidden');
  });

  it('is discoverable by screen readers via role="img"', () => {
    render(<Icon name="ShieldCheck" label={LABEL} />);
    const iconElement = screen.getByRole('img', { name: LABEL });
    expect(iconElement).toBeInTheDocument();
  });

  it('announces the correct label to screen readers', () => {
    const label = 'View user account details';
    render(<Icon name="User" label={label} />);
    const iconElement = screen.getByRole('img', { name: label });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveAttribute('aria-label', label);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Keyboard Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Keyboard Accessibility', () => {
  it('is not focusable via keyboard (focusable="false")', () => {
    const { container } = render(<Icon name="ShieldCheck" />);
    const svg = container.querySelector('svg');
    // focusable="false" prevents SVG from receiving Tab focus
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('does not have tabIndex that would make it focusable', () => {
    const { container } = render(<Icon name="User" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('tabindex', '0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Context — Icons in Interactive Elements
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Accessibility in Interactive Contexts', () => {
  it('works correctly inside a button with visible text (decorative)', async () => {
    const { container } = render(
      <button type="button">
        <Icon name="FileText" size="sm" />
        <span>Download Report</span>
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('works correctly inside an icon-only button (informative)', async () => {
    const { container } = render(
      <button type="button" aria-label="Download report">
        <Icon name="FileText" size="sm" label="Download" />
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
