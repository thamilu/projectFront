'use client';

/**
 * TabContent.tsx
 *
 * Orchestrates lazy loading, error handling, and animated transitions
 * for profile sub-tabs based on the active tab selection.
 *
 * @remarks
 * - Tab configuration is data-driven via TAB_CONFIG.
 * - Each tab is lazy-loaded with code splitting.
 * - Error boundaries prevent chunk failures from crashing the page.
 * - Animations respect user's prefers-reduced-motion preference.
 *
 * @see {@link TAB_CONFIG} for tab metadata and component mapping.
 * @see {@link ProfileSkeleton} for the loading fallback.
 */

import React, { Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { ErrorBoundary } from '@/shared/ui/feedback/error-boundary';
import { ProfileSkeleton } from '../ProfileSkeleton';
import { TAB_CONFIG } from './tabContent.config';
import { CARD_CLASSES, FULL_VARIANTS, REDUCED_VARIANTS } from './tabContent.constants';
import type { ProfileTab } from '../../utils/profile.constants';
import type { SharedActions } from '../../types/profile.types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface TabContentProps {
  /** The currently active tab identifier. */
  activeTab: ProfileTab;
  /** Shared form action handlers and state. */
  sharedActions: SharedActions;
  /** Whether this is the initial page load — determines skeleton variant. */
  isInitialLoad?: boolean;
}

// ─────────────────────────────────────────────
// Private Sub-components
// ─────────────────────────────────────────────

function TabLoadErrorFallback() {
  return (
    <Card className={CARD_CLASSES}>
      <CardContent>
        <p className="text-muted-foreground py-8 text-center text-sm">
          Failed to load this section. Please refresh the page.
        </p>
      </CardContent>
    </Card>
  );
}

interface AnimatedTabCardProps {
  motionKey: string;
  title: string;
  description: string;
  tabVariants: Variants;
  children: React.ReactNode;
}

const AnimatedTabCard = React.memo(function AnimatedTabCard({
  motionKey,
  title,
  description,
  tabVariants,
  children,
}: AnimatedTabCardProps) {
  return (
    <motion.div
      key={motionKey}
      role="tabpanel"
      id={`tabpanel-${motionKey}`}
      aria-labelledby={`tab-${motionKey}`}
      tabIndex={0}
      variants={tabVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card className={CARD_CLASSES}>
        <CardHeader>
          <CardTitle className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </CardTitle>
          <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
});

AnimatedTabCard.displayName = 'AnimatedTabCard';

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const TabContent = React.memo(function TabContent({
  activeTab,
  sharedActions,
  isInitialLoad = false,
}: TabContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const tabVariants = prefersReducedMotion ? REDUCED_VARIANTS : FULL_VARIANTS;
  const activeConfig = TAB_CONFIG[activeTab];

  // Guard against runtime tab values not in TAB_CONFIG (e.g., from URL params)
  if (!activeConfig) {
    console.warn(`TabContent: No config found for tab "${activeTab}"`);
    return null;
  }

  const { motionKey, title, description, hasNext, hasBack, component: TabComponent } = activeConfig;

  return (
    <div className="w-full" aria-live="polite" aria-atomic="false">
      <ErrorBoundary fallback={() => <TabLoadErrorFallback />} name="TabContent">
        <Suspense
          fallback={
            <ProfileSkeleton variant={isInitialLoad ? 'full' : activeConfig.skeletonVariant} />
          }
        >
          <AnimatePresence mode="wait">
            <AnimatedTabCard
              key={motionKey}
              motionKey={motionKey}
              title={title}
              description={description}
              tabVariants={tabVariants}
            >
              <TabComponent actions={sharedActions} hasNext={hasNext} hasBack={hasBack} />
            </AnimatedTabCard>
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

TabContent.displayName = 'TabContent';
