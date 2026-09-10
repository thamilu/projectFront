import React from 'react';
import {
  createSectionsConfig,
  getSectionById,
  getSectionsByPriority,
  getSectionsByOwner,
  getTotalEstimatedLoadTime,
  getABTestSections,
  getVisibleSections,
} from '@/features/home/config/home-sections.config';
import { SECTION_PRIORITY } from '@/types/home';
import type { HomePageSection } from '@/types/home';

// Dummy components for test configs
const DummyComponent = () => <div>Dummy</div>;
const DummySkeleton = () => <div>Loading...</div>;
const DummyFallback = () => <div>Error!</div>;

describe('home-sections.config', () => {
  describe('createSectionsConfig validation', () => {
    it('successfully validates a correct section config array', () => {
      const validConfig: HomePageSection[] = [
        {
          id: 'test-1',
          order: 1,
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Test 1 Label',
          metadata: { estimatedLoadTime: 100, owner: 'test-team' },
        },
        {
          id: 'test-2',
          order: 2,
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.HIGH,
          ariaLabel: 'Test 2 Label',
          metadata: { estimatedLoadTime: 200, owner: 'test-team-2' },
        },
      ];

      const result = createSectionsConfig(validConfig);
      expect(result).toHaveLength(2);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('throws error on duplicate IDs', () => {
      const invalidConfig: HomePageSection[] = [
        {
          id: 'dup-id',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label',
        },
        {
          id: 'dup-id',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label 2',
        },
      ];

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        '[HomePageSections] Duplicate IDs found: dup-id'
      );
    });

    it('throws error when a section is missing an ID', () => {
      const invalidConfig: HomePageSection[] = [
        {
          id: '',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label',
        },
      ];

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section at index 0 missing required 'id' field"
      );
    });

    it('throws error when a section is missing a Component', () => {
      const invalidConfig = [
        {
          id: 'test',
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label',
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' missing required 'Component' field"
      );
    });

    it('throws error when a section is missing a Skeleton', () => {
      const invalidConfig = [
        {
          id: 'test',
          Component: DummyComponent,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label',
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' missing required 'Skeleton' field"
      );
    });

    it('throws error when a section is missing an ErrorFallback', () => {
      const invalidConfig = [
        {
          id: 'test',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label',
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' missing required 'ErrorFallback' field"
      );
    });

    it('throws error when a section is missing priority', () => {
      const invalidConfig = [
        {
          id: 'test',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          ariaLabel: 'Label',
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' missing required 'priority' field"
      );
    });

    it('throws error when a section has invalid priority value', () => {
      const invalidConfig = [
        {
          id: 'test',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: 'INVALID_PRIORITY',
          ariaLabel: 'Label',
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' has invalid priority 'INVALID_PRIORITY'."
      );
    });

    it('throws error when a section is missing ariaLabel', () => {
      const invalidConfig = [
        {
          id: 'test',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' missing required 'ariaLabel' field"
      );
    });

    it('throws error when order is invalid', () => {
      const invalidConfig = [
        {
          id: 'test',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label',
          order: -5,
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' has invalid order '-5'. Order must be a non-negative number."
      );
    });

    it('throws error when estimatedLoadTime is invalid', () => {
      const invalidConfig = [
        {
          id: 'test',
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label',
          metadata: { estimatedLoadTime: -10 },
        },
      ] as any;

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        "[HomePageSections] Section 'test' has invalid estimatedLoadTime. Must be a non-negative number (milliseconds)."
      );
    });

    it('throws error on duplicate order values', () => {
      const invalidConfig: HomePageSection[] = [
        {
          id: 'test-1',
          order: 10,
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label 1',
        },
        {
          id: 'test-2',
          order: 10,
          Component: DummyComponent,
          Skeleton: DummySkeleton,
          ErrorFallback: DummyFallback,
          priority: SECTION_PRIORITY.LOW,
          ariaLabel: 'Label 2',
        },
      ];

      expect(() => createSectionsConfig(invalidConfig)).toThrow(
        '[HomePageSections] Duplicate order values found: 10. Each section must have a unique order value.'
      );
    });
  });

  describe('visible sections query helpers', () => {
    it('returns the frozen visible sections array', () => {
      const sections = getVisibleSections();
      expect(Array.isArray(sections)).toBe(true);
      expect(Object.isFrozen(sections)).toBe(true);

      // Ensure it is sorted by order
      for (let i = 0; i < sections.length - 1; i++) {
        expect((sections[i].order ?? 0) <= (sections[i + 1].order ?? 0)).toBe(true);
      }
    });

    it('gets a section by ID', () => {
      const section = getSectionById('hero');
      expect(section).toBeDefined();
      expect(section?.id).toBe('hero');

      const nonExistent = getSectionById('invalid-id');
      expect(nonExistent).toBeUndefined();
    });

    it('gets sections by priority', () => {
      const criticalSections = getSectionsByPriority(SECTION_PRIORITY.CRITICAL);
      expect(criticalSections.length).toBeGreaterThan(0);
      criticalSections.forEach((s) => {
        expect(s.priority).toBe(SECTION_PRIORITY.CRITICAL);
      });
    });

    it('gets sections by owner', () => {
      const marketingSections = getSectionsByOwner('marketing-team');
      expect(marketingSections.length).toBeGreaterThan(0);
      marketingSections.forEach((s) => {
        expect(s.metadata?.owner).toBe('marketing-team');
      });
    });

    it('computes total estimated load time for all visible sections', () => {
      const totalTime = getTotalEstimatedLoadTime();
      expect(typeof totalTime).toBe('number');
      expect(totalTime).toBeGreaterThan(0);

      // Verify the summation manually
      const expectedTotal = getVisibleSections().reduce(
        (sum, s) => sum + (s.metadata?.estimatedLoadTime ?? 0),
        0
      );
      expect(totalTime).toBe(expectedTotal);
    });

    it('gets sections that are configured for A/B testing', () => {
      const abSections = getABTestSections();
      expect(abSections.length).toBeGreaterThan(0);
      abSections.forEach((s) => {
        expect(s.metadata?.abTestId).toBeDefined();
      });
    });

    // Regression: 'testimonials' (fabricated named customer quotes) was
    // previously always visible to every homepage visitor. It's now gated
    // behind a feature flag that defaults to false until backed by real
    // content.
    it('does not show the fabricated testimonials by default', () => {
      const visibleIds = getVisibleSections().map((s) => s.id);
      expect(visibleIds).not.toContain('testimonials');
    });

    it('still defines the testimonials section in the full config, just gated off', () => {
      expect(getSectionById('testimonials')).toBeDefined();
      expect(getSectionById('testimonials')?.featureFlag).toBe('HOME_TESTIMONIALS');
    });

    // Regression: 'featured-slider' rendered eight hardcoded "Product 1..8"
    // mock items linking to likely-nonexistent product IDs, duplicating the
    // real, data-backed 'featured-products' section already on the same
    // page. Removed entirely rather than flagged off, since there was no
    // real content it could ever be turned back on to show.
    it('no longer defines the fake best-sellers slider section at all', () => {
      const visibleIds = getVisibleSections().map((s) => s.id);
      expect(visibleIds).not.toContain('featured-slider');
      expect(getSectionById('featured-slider')).toBeUndefined();
    });
  });
});
