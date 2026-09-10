/**
 * @fileoverview Skeleton System — Accessibility Tests
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import 'jest-axe/extend-expect';

import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  LoadingRegion,
} from '@/shared/ui/atoms/skeleton';

expect.extend(toHaveNoViolations);

describe('Skeleton System — WCAG 2.2 Axe Audit', () => {
  it('Skeleton has no violations', async () => {
    const { container } = render(<Skeleton className="h-10 w-10" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SkeletonText has no violations', async () => {
    const { container } = render(<SkeletonText lines={4} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SkeletonAvatar has no violations', async () => {
    const { container } = render(<SkeletonAvatar size="md" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SkeletonCard has no violations', async () => {
    const { container } = render(<SkeletonCard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LoadingRegion has no violations', async () => {
    const { container } = render(
      <LoadingRegion label="Loading user details">
        <div>Content loaded</div>
      </LoadingRegion>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Multiple skeletons in LoadingRegion have no violations', async () => {
    const { container } = render(
      <LoadingRegion label="Loading multi-column statistics">
        <div className="flex gap-4">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <Skeleton size="lg" className="mb-2 w-1/3" />
            <SkeletonText lines={2} />
          </div>
        </div>
      </LoadingRegion>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Edge cases
  it('SkeletonCard with all options enabled has no violations', async () => {
    const { container } = render(<SkeletonCard showImage={true} showAvatar={true} bodyLines={4} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Nested LoadingRegions have no violations', async () => {
    const { container } = render(
      <LoadingRegion label="Outer loading region">
        <LoadingRegion label="Inner loading region">
          <SkeletonText lines={2} />
        </LoadingRegion>
      </LoadingRegion>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
