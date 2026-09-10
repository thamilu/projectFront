/**
 * @fileoverview Enterprise Icon System
 *
 * @description
 * Centralized icon registry wrapping Lucide React.
 * Enforces design system sizing tokens, WCAG 2.2 AA accessibility,
 * runtime safety, memoization, and optimal render performance.
 *
 * Architecture Rules:
 * - NEVER import Lucide icons directly in feature components
 * - ALWAYS add new icons to the Icons registry here
 * - ALWAYS use semantic size tokens instead of raw pixel values
 * - Use `label` prop for informative icons, omit for decorative icons
 *
 * @module shared/ui/atoms/icons/Icon
 * @version 2.0.0
 *
 * @example Decorative icon (next to visible text label)
 * <Icon name="ShieldCheck" size="md" className="text-green-600" />
 *
 * @example Informative icon (standalone — conveys meaning)
 * <Icon name="User" size="lg" label="View user profile" />
 *
 * @example Dynamic icon name from API (with type guard)
 * const name = apiResponse.iconName;
 * if (isIconName(name)) {
 *   return <Icon name={name} size="sm" />;
 * }
 *
 * @see {@link https://lucide.dev/icons} Lucide Icon Reference
 * @see {@link https://www.w3.org/WAI/WCAG22/Understanding/non-text-content} WCAG 2.2 Non-text Content
 */

import React, { memo } from 'react';
import {
  type LucideProps,
  ShieldCheck as ShieldCheckIcon,
  FileText as FileTextIcon,
  Landmark as LandmarkIcon,
  User as UserIcon,
  AlertCircle as AlertCircleIcon,
  HelpCircle as HelpCircleIcon,
  Check as CheckIcon,
} from 'lucide-react';

import { cn } from '@/shared/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Icon Registry & Named Exports (Issue #6)
// ─────────────────────────────────────────────────────────────────────────────

// Named exports guarantee tree-shaking in all major bundlers for static imports.
export {
  ShieldCheckIcon as ShieldCheck,
  FileTextIcon as FileText,
  LandmarkIcon as Landmark,
  UserIcon as User,
  AlertCircleIcon as AlertCircle,
  HelpCircleIcon as HelpCircle,
  CheckIcon as Check,
};

/**
 * Central icon registry — single source of truth for all icons in the system.
 * Only icons listed here are included in the bundle.
 */
export const Icons = {
  ShieldCheck: ShieldCheckIcon,
  FileText: FileTextIcon,
  Landmark: LandmarkIcon,
  User: UserIcon,
  AlertCircle: AlertCircleIcon,
  HelpCircle: HelpCircleIcon,
  Check: CheckIcon,
} as const satisfies Record<string, React.ComponentType<LucideProps>>;

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Design System Size Tokens
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Icon size scale — aligned with design system spacing and typography tokens.
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
} as const satisfies Record<string, number>;

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type IconName = keyof typeof Icons;
export type IconSize = keyof typeof ICON_SIZES;

export interface IconProps extends Omit<LucideProps, 'ref' | 'size'> {
  name: IconName;
  size?: IconSize | number;
  label?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: Icon Component
// ─────────────────────────────────────────────────────────────────────────────

export const Icon = memo(function Icon({
  name,
  label,
  size = 'md',
  className,
  ...props
}: IconProps) {
  // ── 1. Runtime Safety Guard (Issue #2) ───────────────────────────────────
  const LucideIcon = Icons[name];

  if (!LucideIcon) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[Icon] Unknown icon name: "${String(name)}". ` +
          `Available icons: ${Object.keys(Icons).join(', ')}. ` +
          `Add it to the Icons registry in shared/ui/atoms/icons/Icon.tsx.`
      );
    }
    return null;
  }

  // ── 2. Size Resolution (Issue #4) ────────────────────────────────────────
  const resolvedSize = typeof size === 'string' ? ICON_SIZES[size] : size;

  // ── 3. WCAG 2.2 AA Accessibility (Issue #3) ──────────────────────────────
  const isDecorative = !label;
  const a11yProps = isDecorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': label } as const);

  // ── 4. Render (Issue #8) ─────────────────────────────────────────────────
  return (
    <LucideIcon
      size={resolvedSize}
      focusable="false"
      className={cn('shrink-0', 'inline-block', className)}
      {...a11yProps}
      {...props}
    />
  );
});

Icon.displayName = 'Icon'; // Issue #1

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && value in Icons;
}

export function resolveIconSize(size: IconSize | number): number {
  return typeof size === 'string' ? ICON_SIZES[size] : size;
}
