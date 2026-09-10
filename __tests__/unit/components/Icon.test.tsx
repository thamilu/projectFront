/**
 * @fileoverview Icon Component — Functional Unit Tests
 *
 * @description
 * Tests covering:
 * - Correct rendering for all registered icons
 * - Runtime null guard and development warning
 * - Size token resolution
 * - Prop forwarding (className, data-testid, etc.)
 * - Memoization stability
 * - Utility function correctness
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  Icon,
  Icons,
  ICON_SIZES,
  isIconName,
  resolveIconSize,
  type IconName,
  type IconSize,
} from '@/shared/ui/atoms/icons/Icon';

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

const ALL_ICON_NAMES = Object.keys(Icons) as IconName[];
const ALL_SIZE_TOKENS = Object.keys(ICON_SIZES) as IconSize[];

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: Core Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Core Rendering', () => {
  it('renders without crashing for every registered icon', () => {
    ALL_ICON_NAMES.forEach((name) => {
      const { container, unmount } = render(<Icon name={name} data-testid="icon" />);
      // SVG element is rendered
      expect(container.querySelector('svg')).toBeInTheDocument();
      unmount();
    });
  });

  it('renders an SVG element as the root node', () => {
    render(<Icon name="ShieldCheck" data-testid="icon" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.tagName.toLowerCase()).toBe('svg');
  });

  it('has displayName set to "Icon" for React DevTools', () => {
    expect(Icon.displayName).toBe('Icon');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Runtime Safety Guard
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Runtime Safety Guard', () => {
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

  afterEach(() => consoleSpy.mockClear());
  afterAll(() => consoleSpy.mockRestore());

  it('returns null for unknown icon names (no crash)', () => {
    const { container } = render(<Icon name={'Unknown' as IconName} />);
    expect(container.firstChild).toBeNull();
  });

  it('logs a development warning for unknown icon names', () => {
    render(<Icon name={'Unknown' as IconName} />);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Icon]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown'));
  });

  it('includes available icon names in the warning message', () => {
    render(<Icon name={'Missing' as IconName} />);
    ALL_ICON_NAMES.forEach((name) => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(name));
    });
  });

  it('renders null without throwing — React tree remains stable', () => {
    expect(() => {
      render(
        <div>
          <span>Before</span>
          <Icon name={'Bad' as IconName} />
          <span>After</span>
        </div>
      );
    }).not.toThrow();

    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Size Token Resolution
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Size Token Resolution', () => {
  it.each(ALL_SIZE_TOKENS)('renders with correct pixel size for token "%s"', (token) => {
    const expectedPx = ICON_SIZES[token];
    const { container } = render(<Icon name="ShieldCheck" size={token} />);
    const svg = container.querySelector('svg');

    // Lucide sets width and height attributes on the SVG
    expect(svg).toHaveAttribute('width', String(expectedPx));
    expect(svg).toHaveAttribute('height', String(expectedPx));
  });

  it('accepts raw pixel number values', () => {
    const { container } = render(<Icon name="ShieldCheck" size={28} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '28');
    expect(svg).toHaveAttribute('height', '28');
  });

  it('defaults to md (20px) when size is not provided', () => {
    const { container } = render(<Icon name="ShieldCheck" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Prop Forwarding
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Prop Forwarding', () => {
  it('forwards className to the SVG element', () => {
    const { container } = render(<Icon name="User" className="custom-icon text-blue-600" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-blue-600');
    expect(svg).toHaveClass('custom-icon');
  });

  it('always includes shrink-0 class for layout safety', () => {
    const { container } = render(<Icon name="User" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('shrink-0');
  });

  it('always includes inline-block class for alignment', () => {
    const { container } = render(<Icon name="User" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('inline-block');
  });

  it('forwards data-testid and other HTML attributes', () => {
    render(<Icon name="FileText" data-testid="file-icon" data-custom="value" />);
    const svg = document.querySelector('[data-testid="file-icon"]');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('data-custom', 'value');
  });

  it('sets focusable="false" to prevent SVG focus in legacy browsers', () => {
    const { container } = render(<Icon name="Landmark" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Memoization
// ─────────────────────────────────────────────────────────────────────────────

describe('Icon — Memoization', () => {
  it('does not re-render when props are unchanged', () => {
    const renderSpy = jest.fn();

    // Wrap Icon to spy on renders
    const SpyIcon = (props: Parameters<typeof Icon>[0]) => {
      renderSpy();
      return <Icon {...props} />;
    };
    const MemoSpyIcon = React.memo(SpyIcon);

    const { rerender } = render(<MemoSpyIcon name="ShieldCheck" size="md" />);

    // Re-render parent with same props
    rerender(<MemoSpyIcon name="ShieldCheck" size="md" />);

    // Should render exactly once — memo prevented the second render
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('re-renders when props change', () => {
    const { rerender, container } = render(<Icon name="ShieldCheck" size="md" />);

    let svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');

    rerender(<Icon name="ShieldCheck" size="lg" />);
    svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6: isIconName Utility
// ─────────────────────────────────────────────────────────────────────────────

describe('isIconName — Type Guard Utility', () => {
  it.each(ALL_ICON_NAMES)('returns true for valid icon name "%s"', (name) => {
    expect(isIconName(name)).toBe(true);
  });

  it('returns false for unknown string', () => {
    expect(isIconName('NonExistent')).toBe(false);
    expect(isIconName('star')).toBe(false); // case-sensitive
    expect(isIconName('')).toBe(false);
  });

  it('returns false for non-string types', () => {
    expect(isIconName(null)).toBe(false);
    expect(isIconName(undefined)).toBe(false);
    expect(isIconName(42)).toBe(false);
    expect(isIconName({})).toBe(false);
    expect(isIconName([])).toBe(false);
    expect(isIconName(true)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7: resolveIconSize Utility
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveIconSize — Size Resolution Utility', () => {
  it.each(Object.entries(ICON_SIZES) as [IconSize, number][])(
    'resolves token "%s" to %dpx',
    (token, expectedPx) => {
      expect(resolveIconSize(token)).toBe(expectedPx);
    }
  );

  it('passes through raw pixel numbers unchanged', () => {
    expect(resolveIconSize(1)).toBe(1);
    expect(resolveIconSize(28)).toBe(28);
    expect(resolveIconSize(100)).toBe(100);
  });
});
