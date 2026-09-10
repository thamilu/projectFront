/**
 * @file tabs.tsx
 * @description Ultra-enterprise-grade Tabs component system.
 *
 * Architecture:
 * ─ CVA for compile-time variant safety (pills | underline | card | vertical)
 * ─ Radix UI Tabs primitives for full ARIA/keyboard accessibility
 * ─ Context propagation: variant/orientation flow Tabs → List → Trigger → Content
 * ─ data-slot attributes for parent-level CSS composition targeting
 * ─ Component-local warnOnce registry (no shared state pollution)
 * ─ Dev warnings in useEffect (pure render body, React Strict Mode safe)
 * ─ Tab content animation with transition-based duration classes
 * ─ Consistent shadow/spacing tokens matching design system
 * ─ TypeScript strict-mode compatible (orientation type constraint)
 *
 * Keyboard navigation (managed by Radix):
 * ─ ArrowLeft/Right: cycle triggers (horizontal)
 * ─ ArrowUp/Down:   cycle triggers (vertical)
 * ─ Tab:            move focus into active panel
 * ─ Home/End:       jump to first/last trigger
 *
 * @module @/shared/ui/atoms/tabs
 * @version 3.0.0
 * @since 1.0.0
 *
 * @see https://www.radix-ui.com/docs/primitives/components/tabs
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/
 */

'use client';
// Justified: useContext (useTabs hook), useMemo (context value stability),
// useEffect (dev warnings post-mount). Pure CVA utilities and types are
// bundled here but are semantically server-compatible.

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

// ─────────────────────────────────────────────────────────────────────────────
// § 1. CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Display names — dot notation for compound component DevTools clarity */
const TABS_DISPLAY_NAME = 'Tabs' as const;
const TABS_LIST_DISPLAY_NAME = 'Tabs.List' as const;
const TABS_TRIGGER_DISPLAY_NAME = 'Tabs.Trigger' as const;
const TABS_CONTENT_DISPLAY_NAME = 'Tabs.Content' as const;

/**
 * data-slot values for CSS composition and design system targeting.
 *
 * @example
 * // Target all tab lists globally:
 * [data-slot="tabs-list"] { border-bottom: 2px solid var(--border); }
 *
 * // Target active triggers:
 * [data-slot="tabs-trigger"][data-state="active"] { font-weight: 600; }
 *
 * // Variant-specific targeting:
 * [data-slot="tabs"][data-variant="underline"] [data-slot="tabs-list"] { ... }
 */
const TABS_SLOTS = {
  root: 'tabs',
  list: 'tabs-list',
  trigger: 'tabs-trigger',
  content: 'tabs-content',
} as const satisfies Record<'root' | 'list' | 'trigger' | 'content', `tabs${string}`>;

// ─────────────────────────────────────────────────────────────────────────────
// § 2. DEV WARNING REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Component-local warning registry.
 *
 * Intentionally NOT imported from @/shared/utils to prevent:
 * 1. Cross-component warning key collisions
 * 2. Shared mutable state between unrelated components
 * 3. Circular dependency risks
 *
 * Pattern: matches React's own internal warning deduplication.
 */
const _tabsWarnRegistry = new Set<string>();

function warnOnce(key: string, level: 'warn' | 'error', message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (_tabsWarnRegistry.has(key)) return;
  _tabsWarnRegistry.add(key);
  if (level === 'error') {
    console.error(`[Tabs] ${message}`);
  } else {
    console.warn(`[Tabs] ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Orientation type — explicit union prevents undefined propagation */
type OrientationType = 'horizontal' | 'vertical';

/**
 * TabsVariant — derived from CVA to stay in sync automatically.
 * Adding a variant to CVA updates this type without manual changes.
 */
type TabsVariant = NonNullable<VariantProps<typeof tabsListVariants>['variant']>;

// ─────────────────────────────────────────────────────────────────────────────
// § 4. CVA VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TabsList visual variants.
 *
 * pills    — floating pill container (default, Shadcn-style)
 * underline — bottom-border style (GitHub, Linear style)
 * card     — bordered card container
 * vertical — left sidebar navigation
 */
const tabsListVariants = cva(
  // Base: shared layout properties
  'flex items-center',
  {
    variants: {
      variant: {
        pills:
          'inline-flex justify-center bg-muted text-muted-foreground h-10 rounded-lg p-1 gap-1',

        underline:
          'justify-start w-full border-b border-border h-10 rounded-none bg-transparent gap-0 overflow-visible',

        card: 'inline-flex justify-center bg-background border border-border rounded-lg p-1 shadow-sm h-10 gap-1',

        vertical:
          'flex-col justify-start h-auto w-auto min-w-[12rem] max-w-[16rem] bg-muted rounded-lg p-1 gap-1',
      },
    },
    defaultVariants: { variant: 'pills' },
  }
);

/**
 * TabsTrigger visual variants.
 * Each pairs with its tabsListVariant counterpart.
 *
 * Touch target: min-h-[2.75rem] = 44px satisfies WCAG 2.5.5 (AAA).
 */
const tabsTriggerVariants = cva(
  [
    // ── Layout ──────────────────────────────────────────────
    'inline-flex items-center justify-center',
    // ── Typography ──────────────────────────────────────────
    'text-sm font-medium whitespace-nowrap',
    // ── Transition ──────────────────────────────────────────
    'transition-all duration-150 ease-in-out',
    // ── Focus ring (keyboard navigation) ────────────────────
    'ring-offset-background',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    // ── Disabled ────────────────────────────────────────────
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    // ── Active press micro-interaction ──────────────────────
    // motion-safe: respects prefers-reduced-motion automatically
    'motion-safe:active:scale-[0.97]',
    'motion-reduce:transform-none',
  ].join(' '),
  {
    variants: {
      variant: {
        pills: [
          'rounded-md px-3 py-1.5',
          'min-h-[2.75rem]', // 44px WCAG 2.5.5 touch target
          // Inactive state
          'data-[state=inactive]:text-muted-foreground',
          'data-[state=inactive]:hover:bg-background/60',
          'data-[state=inactive]:hover:text-foreground',
          // Active state
          'data-[state=active]:bg-background',
          'data-[state=active]:text-foreground',
          'data-[state=active]:shadow-sm',
        ].join(' '),

        underline: [
          'rounded-none border-b-2 border-transparent',
          'px-4 py-2 -mb-px',
          'min-h-[2.75rem]', // 44px touch target
          // Inactive
          'data-[state=inactive]:text-muted-foreground',
          'data-[state=inactive]:hover:text-foreground',
          'data-[state=inactive]:hover:border-border',
          // Active
          'data-[state=active]:border-primary',
          'data-[state=active]:text-foreground',
        ].join(' '),

        card: [
          'rounded-md px-4 py-2',
          'min-h-[2.75rem]', // 44px touch target
          'data-[state=inactive]:text-muted-foreground',
          'data-[state=inactive]:hover:bg-muted/80',
          'data-[state=active]:bg-muted',
          'data-[state=active]:text-foreground',
          'data-[state=active]:shadow-sm',
        ].join(' '),

        vertical: [
          'w-full justify-start rounded-md px-3 py-2',
          'min-h-[2.75rem]', // 44px touch target
          'data-[state=inactive]:text-muted-foreground',
          'data-[state=inactive]:hover:bg-background',
          'data-[state=inactive]:hover:text-foreground',
          'data-[state=active]:bg-background',
          'data-[state=active]:text-foreground',
          'data-[state=active]:shadow-sm',
        ].join(' '),
      },
    },
    defaultVariants: { variant: 'pills' },
  }
);

/**
 * TabsContent animation variants.
 *
 * Animation: opacity transition (no plugin dependency).
 * Reduced motion: transition-none applied automatically via motion-reduce:.
 */
const tabsContentVariants = cva(
  [
    // ── Focus ring ──────────────────────────────────────────
    'ring-offset-background',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    // ── Opacity animation (no tailwindcss-animate dependency) ─
    'transition-opacity duration-150 ease-in-out',
    'data-[state=inactive]:opacity-0',
    'data-[state=inactive]:pointer-events-none',
    'data-[state=active]:opacity-100',
    // ── Reduced motion override ──────────────────────────────
    'motion-reduce:transition-none',
  ].join(' '),
  {
    variants: {
      variant: {
        pills: '', // Gap controlled by Tabs root gap-2
        underline: 'pt-4', // Extra top padding for underline style
        card: 'p-4 border border-border rounded-lg bg-background',
        vertical: 'flex-1 pl-4 min-w-0', // min-w-0 prevents flex child overflow
      },
    },
    defaultVariants: { variant: 'pills' },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// § 5. CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TabsContextValue — shared state propagated from Tabs root to descendants.
 */
interface TabsContextValue {
  /** Visual variant — inherited by List, Trigger, Content */
  variant: TabsVariant;
  /** Layout/keyboard orientation */
  orientation: OrientationType;
}

const TabsContext = React.createContext<TabsContextValue>({
  variant: 'pills',
  orientation: 'horizontal',
});

// displayName assignment works in React DevTools, assertion ensures compatibility
(TabsContext as React.Context<TabsContextValue> & { displayName: string }).displayName =
  'TabsContext';

/**
 * useTabs — access parent Tabs variant and orientation.
 *
 * Returns stable defaults when used outside a <Tabs> component.
 * Exported for advanced consumers building custom tab-adjacent components.
 *
 * @example
 * function CustomTabBadge() {
 *   const { variant } = useTabs();
 *   return <span className={cn(badgeVariants({ variant }))}>3</span>;
 * }
 */
function useTabs(): TabsContextValue {
  return React.useContext(TabsContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. TABS ROOT
// ─────────────────────────────────────────────────────────────────────────────

interface TabsProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
  'orientation'
> {
  /**
   * Visual style variant — propagated automatically to all child components.
   *
   * - `pills`     — floating pill container (default)
   * - `underline` — bottom-border underline style (GitHub/Linear style)
   * - `card`      — bordered card container with panel background
   * - `vertical`  — left sidebar navigation layout
   *
   * @default 'pills'
   */
  variant?: TabsVariant;

  /**
   * Layout and keyboard navigation orientation.
   * horizontal: ArrowLeft/Right to cycle triggers
   * vertical: ArrowUp/Down to cycle triggers
   * @default 'horizontal'
   */
  orientation?: OrientationType;

  /**
   * Accessible label for the entire tabs widget.
   * Required when multiple tab groups exist on the same page.
   * @example aria-label="Product configuration tabs"
   */
  'aria-label'?: string;

  /**
   * QA automation selector.
   * Prefer role-based queries in tests.
   */
  'data-testid'?: string;
}

/**
 * Tabs — accessible tabbed navigation built on Radix UI.
 *
 * All ARIA semantics (role="tablist", role="tab", role="tabpanel",
 * aria-selected, aria-controls, aria-labelledby) are auto-managed
 * by Radix UI primitives.
 *
 * @example
 * // Default pill tabs
 * <Tabs defaultValue="account">
 *   <TabsList aria-label="Account settings">
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">Account content</TabsContent>
 *   <TabsContent value="password">Password content</TabsContent>
 * </Tabs>
 */
const Tabs = React.forwardRef<React.ComponentRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ variant = 'pills', orientation = 'horizontal', className, ...props }, ref) => {
    /**
     * useMemo justified: creates stable object reference for context value.
     * Without memo, every Tabs render creates a new context object,
     * causing all consumers (List, Trigger, Content) to re-render.
     */
    const contextValue = React.useMemo<TabsContextValue>(
      () => ({
        variant,
        orientation: orientation ?? 'horizontal',
      }),
      [variant, orientation]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <TabsPrimitive.Root
          ref={ref}
          data-slot={TABS_SLOTS.root}
          data-variant={variant}
          orientation={orientation}
          className={cn(
            'flex gap-2',
            orientation === 'vertical' ? 'flex-row' : 'flex-col',
            className
          )}
          {...props}
        />
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = TABS_DISPLAY_NAME;

// ─────────────────────────────────────────────────────────────────────────────
// § 7. TABS LIST
// ─────────────────────────────────────────────────────────────────────────────

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVariant;
  /**
   * QA automation selector.
   */
  'data-testid'?: string;
}

/**
 * TabsList — container for tab trigger buttons.
 *
 * @accessibility
 * Always provide aria-label or aria-labelledby for screen readers.
 * Without it, the tab group purpose is ambiguous.
 *
 * @example
 * <TabsList aria-label="Dashboard sections">
 *   <TabsTrigger value="overview">Overview</TabsTrigger>
 *   <TabsTrigger value="analytics">Analytics</TabsTrigger>
 * </TabsList>
 */
const TabsList = React.forwardRef<React.ComponentRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant: variantProp, ...props }, ref) => {
    const { variant: contextVariant } = useTabs();
    const variant = variantProp ?? contextVariant;

    // ── Dev warning validation in useEffect (React Strict Mode compliant) ──
    const hasAccessibleName = Boolean(props['aria-label'] || props['aria-labelledby']);

    React.useEffect(() => {
      if (process.env.NODE_ENV === 'production') return;
      if (!hasAccessibleName) {
        warnOnce(
          'tabs-list:missing-aria-label',
          'warn',
          'TabsList is missing an accessible name.\n' +
            'Add aria-label="..." or aria-labelledby="...".\n' +
            'WCAG 4.1.2 — Name, Role, Value.\n' +
            'Fix: <TabsList aria-label="Account settings">'
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <TabsPrimitive.List
        ref={ref}
        data-slot={TABS_SLOTS.list}
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
TabsList.displayName = TABS_LIST_DISPLAY_NAME;

// ─────────────────────────────────────────────────────────────────────────────
// § 8. TABS TRIGGER
// ─────────────────────────────────────────────────────────────────────────────

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: TabsVariant;
  /**
   * QA automation selector.
   */
  'data-testid'?: string;
}

/**
 * TabsTrigger — individual tab button.
 *
 * @accessibility
 * For icon-only triggers, provide aria-label:
 * <TabsTrigger value="settings" aria-label="Settings">
 *   <SettingsIcon aria-hidden="true" />
 * </TabsTrigger>
 *
 * @example
 * <TabsTrigger value="account">Account</TabsTrigger>
 * <TabsTrigger value="billing" disabled>Billing (Coming Soon)</TabsTrigger>
 */
const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant: variantProp, ...props }, ref) => {
  const { variant: contextVariant } = useTabs();
  const variant = variantProp ?? contextVariant;

  // ── Dev warning validation in useEffect (React Strict Mode compliant) ──
  const hasAccessibleName = Boolean(props['aria-label'] || props['aria-labelledby']);
  const hasTextChildren = React.Children.toArray(props.children).some(
    (child) => typeof child === 'string' || typeof child === 'number'
  );
  const isIconOnly = !hasTextChildren;

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (isIconOnly && !hasAccessibleName) {
      warnOnce(
        'tabs-trigger:missing-aria-label',
        'warn',
        'Icon-only TabsTrigger requires an accessible name.\n' +
          'Add aria-label="..." or aria-labelledby="...".\n' +
          'WCAG 4.1.2 — Name, Role, Value.\n' +
          'Fix: <TabsTrigger value="settings" aria-label="Settings"><SettingsIcon /></TabsTrigger>'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot={TABS_SLOTS.trigger}
      data-variant={variant}
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
});
TabsTrigger.displayName = TABS_TRIGGER_DISPLAY_NAME;

// ─────────────────────────────────────────────────────────────────────────────
// § 9. TABS CONTENT
// ─────────────────────────────────────────────────────────────────────────────

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  variant?: TabsVariant;
  /**
   * QA automation selector.
   */
  'data-testid'?: string;
}

/**
 * TabsContent — panel displayed when its associated trigger is active.
 *
 * @note For variant="vertical", TabsContent requires a flex-row parent.
 * This is automatically provided when using the <Tabs> component.
 * Custom Tabs layouts must include 'flex flex-row' on the container.
 *
 * @example
 * <TabsContent value="account">
 *   <AccountSettingsForm />
 * </TabsContent>
 */
const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, variant: variantProp, ...props }, ref) => {
  const { variant: contextVariant } = useTabs();
  const variant = variantProp ?? contextVariant;

  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot={TABS_SLOTS.content}
      data-variant={variant}
      className={cn(tabsContentVariants({ variant }), className)}
      {...props}
    />
  );
});
TabsContent.displayName = TABS_CONTENT_DISPLAY_NAME;

// ─────────────────────────────────────────────────────────────────────────────
// § 10. EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
  TABS_SLOTS,
  useTabs,
};

export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  TabsVariant,
  TabsContextValue,
};
