import type React from 'react';
import type { FeatureFlagKey } from '@/core/feature-flags';

/**
 * Priority constants for homepage sections.
 * Governs the loading, hydration, and animation sequence.
 */
export const SECTION_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

export type SectionPriority = (typeof SECTION_PRIORITY)[keyof typeof SECTION_PRIORITY];

/**
 * Configuration contract for homepage sections.
 * Supports strong typing for component props and error fallback props,
 * dynamic code splitting, and explicit order parameters.
 */
export interface HomePageSection<
  TComponentProps = Record<string, any>,
  TErrorProps = Record<string, any>,
> {
  readonly id: string;
  readonly Component: React.ComponentType<TComponentProps>;
  readonly componentProps?: TComponentProps;
  readonly Skeleton: React.ComponentType;
  readonly ErrorFallback: React.ComponentType<TErrorProps>;
  readonly errorFallbackProps?: TErrorProps;
  readonly priority: SectionPriority;
  readonly ariaLabel: string;
  readonly featureFlag?: FeatureFlagKey;
  readonly order?: number;
  readonly metadata?: {
    readonly trackingId?: string;
    readonly abTestId?: string;
    readonly description?: string;
    readonly owner?: string;
    readonly estimatedLoadTime?: number;
  };
}
