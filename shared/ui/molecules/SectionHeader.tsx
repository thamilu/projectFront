import React, { memo } from 'react';
import { Icon, IconName, IconSize } from '@/shared/ui/atoms';
import { cn } from '@/shared/utils';

export interface SectionHeaderProps {
  /** The icon name from the shared atoms IconName registry. */
  iconName: IconName;
  /** The heading text content. */
  title: string;
  /** Unique identifier for section landmarks or page scroll anchoring. */
  id: string;
  /** The heading level element. Defaults to 'h3'. */
  headingLevel?: 'h2' | 'h3' | 'h4';
  /** Sizing override for the icon badge. Defaults to 'md' (20px). */
  iconSize?: IconSize;
  /** Optional layout or style overrides by the parent context. */
  className?: string;
  /** Keyboard accessibility focus index for scroll anchor targeting. */
  tabIndex?: number;
  /** Test automation selector hook. */
  'data-testid'?: string;
}

/**
 * SectionHeader Component
 *
 * Renders a consistent design-system-compliant header with a leading decorative icon and a text label.
 * Highly accessible structural landmark supporting custom heading levels, dynamic icon sizing, and layout overrides.
 */
export const SectionHeader = memo(function SectionHeader({
  iconName,
  title,
  id,
  headingLevel: Heading = 'h3',
  iconSize = 'md',
  className,
  tabIndex,
  'data-testid': testId = 'section-header',
}: SectionHeaderProps) {
  // ── 1. Defensive Prop Verification ──
  const isTitleEmpty = !title || !title.trim();
  if (isTitleEmpty) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[SectionHeader] The "title" prop was empty or whitespace-only. ` +
          `The component will not render to avoid empty headings in screen reader outlines.`
      );
    }
    return null;
  }

  const isIdEmpty = !id || !id.trim();
  if (isIdEmpty && process.env.NODE_ENV === 'development') {
    console.error(
      `[SectionHeader] The "id" prop must be a non-empty string for correct ARIA landmark/section labeling.`
    );
  }

  // ── 2. Render Component ──
  return (
    <div
      id={id}
      tabIndex={tabIndex}
      data-testid={testId}
      className={cn('text-primary flex items-center gap-3 min-w-0', className)}
    >
      <Icon name={iconName} size={iconSize} />
      <Heading className="text-style-section-label truncate" title={title}>
        {title}
      </Heading>
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';
