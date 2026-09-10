/**
 * @fileoverview Skeleton System — Functional Unit Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  LoadingRegion,
} from '@/shared/ui/atoms/skeleton';

// ── Suite 1: Skeleton Primitive ─────────────────────────────────────────────

describe('Skeleton — Primitive', () => {
  it('renders a div element', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('has role="presentation"', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('role', 'presentation');
  });

  it('has aria-hidden="true"', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('has displayName "Skeleton"', () => {
    expect(Skeleton.displayName).toBe('Skeleton');
  });

  it('forwards className to root element', () => {
    const { container } = render(<Skeleton className="custom w-48" />);
    expect(container.firstChild).toHaveClass('w-48');
    expect(container.firstChild).toHaveClass('custom');
  });

  it('applies motion-safe:animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('motion-safe:animate-pulse');
  });

  it('applies motion-reduce:opacity-50 class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('motion-reduce:opacity-50');
  });
});

// ── Suite 2: Width / Height Props ────────────────────────────────────────────

describe('Skeleton — Dimension Props', () => {
  it('applies numeric width as px style', () => {
    const { container } = render(<Skeleton width={200} />);
    expect(container.firstChild).toHaveStyle({ width: '200px' });
  });

  it('applies string width as-is', () => {
    const { container } = render(<Skeleton width="50%" />);
    expect(container.firstChild).toHaveStyle({ width: '50%' });
  });

  it('applies numeric height as px style', () => {
    const { container } = render(<Skeleton height={40} />);
    expect(container.firstChild).toHaveStyle({ height: '40px' });
  });

  it('applies string height as-is', () => {
    const { container } = render(<Skeleton height="auto" />);
    expect(container.firstChild).toHaveStyle({ height: 'auto' });
  });

  it('handles width={0} correctly — not ignored', () => {
    const { container } = render(<Skeleton width={0} />);
    expect(container.firstChild).toHaveStyle({ width: '0px' });
  });

  it('handles height={0} correctly — not ignored', () => {
    const { container } = render(<Skeleton height={0} />);
    expect(container.firstChild).toHaveStyle({ height: '0px' });
  });

  it('merges style prop with width/height', () => {
    const { container } = render(<Skeleton width={100} style={{ opacity: 0.5 }} />);
    expect(container.firstChild).toHaveStyle({
      width: '100px',
      opacity: 0.5,
    });
  });

  it('does not apply width style when width is undefined', () => {
    const { container } = render(<Skeleton />);
    const style = (container.firstChild as HTMLElement).style;
    expect(style.width).toBe('');
  });
});

// ── Suite 3: CVA Variants ──────────────────────────────────────────────────

describe('Skeleton — Size Variants', () => {
  const sizeClassMap = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  } as const;

  Object.entries(sizeClassMap).forEach(([size, expectedClass]) => {
    it(`applies correct class for size="${size}"`, () => {
      const { container } = render(<Skeleton size={size as keyof typeof sizeClassMap} />);
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('defaults to md (h-4) when size is not provided', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('h-4');
  });

  it('suppresses size class when height prop is provided', () => {
    const { container } = render(<Skeleton height={100} />);
    // h-4 should NOT be present — height prop takes control
    expect(container.firstChild).not.toHaveClass('h-4');
  });
});

describe('Skeleton — Rounded Variants', () => {
  const roundedClassMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  } as const;

  Object.entries(roundedClassMap).forEach(([rounded, expectedClass]) => {
    it(`applies correct class for rounded="${rounded}"`, () => {
      const { container } = render(<Skeleton rounded={rounded as keyof typeof roundedClassMap} />);
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('defaults to rounded-md', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('rounded-md');
  });
});

// ── Suite 4: SkeletonText ───────────────────────────────────────────────────

describe('SkeletonText', () => {
  it('renders the correct number of lines', () => {
    const { container } = render(<SkeletonText lines={4} />);
    expect(container.firstChild?.childNodes.length).toBe(4);
  });

  it('defaults to 3 lines', () => {
    const { container } = render(<SkeletonText />);
    expect(container.firstChild?.childNodes.length).toBe(3);
  });

  it('applies w-3/5 to last line when truncateLastLine=true', () => {
    const { container } = render(<SkeletonText lines={3} truncateLastLine={true} />);
    const lastNode = container.firstChild?.childNodes[2] as HTMLElement;
    expect(lastNode).toHaveClass('w-3/5');
  });

  it('does not truncate last line when truncateLastLine=false', () => {
    const { container } = render(<SkeletonText lines={3} truncateLastLine={false} />);
    const lastNode = container.firstChild?.childNodes[2] as HTMLElement;
    expect(lastNode).not.toHaveClass('w-3/5');
  });

  it('has displayName "SkeletonText"', () => {
    expect(SkeletonText.displayName).toBe('SkeletonText');
  });
});

// ── Suite 5: SkeletonAvatar ─────────────────────────────────────────────────

describe('SkeletonAvatar', () => {
  it('renders with rounded-full class', () => {
    const { container } = render(<SkeletonAvatar />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  const avatarSizes = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  } as const;

  Object.entries(avatarSizes).forEach(([size, expectedClass]) => {
    it(`applies correct dimension class for size="${size}"`, () => {
      const { container } = render(<SkeletonAvatar size={size as keyof typeof avatarSizes} />);
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('has displayName "SkeletonAvatar"', () => {
    expect(SkeletonAvatar.displayName).toBe('SkeletonAvatar');
  });
});

// ── Suite 6: LoadingRegion ──────────────────────────────────────────────────

describe('LoadingRegion', () => {
  it('renders with role="status"', () => {
    render(
      <LoadingRegion label="Loading listings">
        <div>Content</div>
      </LoadingRegion>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('sets aria-label to provided label', () => {
    render(
      <LoadingRegion label="Loading listings">
        <div>Content</div>
      </LoadingRegion>
    );
    expect(screen.getByLabelText('Loading listings')).toBeInTheDocument();
  });

  it('sets aria-busy="true"', () => {
    render(
      <LoadingRegion label="Loading listings">
        <div>Content</div>
      </LoadingRegion>
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-live="polite"', () => {
    render(
      <LoadingRegion label="Loading listings">
        <div>Content</div>
      </LoadingRegion>
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders children inside the region', () => {
    render(
      <LoadingRegion label="Loading listings">
        <div data-testid="child">Child Content</div>
      </LoadingRegion>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('has displayName "LoadingRegion"', () => {
    expect(LoadingRegion.displayName).toBe('LoadingRegion');
  });
});

// ── Suite 7: SkeletonCard ────────────────────────────────────────────────────

describe('SkeletonCard', () => {
  it('renders default skeleton card structure', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('hides image when showImage={false} is provided', () => {
    const { container } = render(<SkeletonCard showImage={false} />);
    const h40Elements = container.getElementsByClassName('h-40');
    expect(h40Elements.length).toBe(0);
  });

  it('hides avatar when showAvatar={false} is provided', () => {
    const { container } = render(<SkeletonCard showAvatar={false} />);
    const nameElements = container.getElementsByClassName('w-24');
    expect(nameElements.length).toBe(0);
  });

  it('renders correct number of text lines', () => {
    const { container } = render(<SkeletonCard bodyLines={4} />);
    const textGroup = container.firstChild?.childNodes[2] as HTMLElement;
    expect(textGroup.childNodes.length).toBe(4);
  });

  it('has displayName "SkeletonCard"', () => {
    expect(SkeletonCard.displayName).toBe('SkeletonCard');
  });
});
