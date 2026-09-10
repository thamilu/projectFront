/**
 * TabContainer.tsx
 *
 * Reusable container for profile tabs.
 * Provides consistent layout, spacing, accessibility context, and form actions.
 */

import React, { type ReactNode } from 'react';
import { FormActions } from '@/shared/ui/molecules/FormActions';
import type { SharedActions } from '@/features/users/types/profile.types';

interface TabContainerProps {
  /** Tab content to render */
  children: ReactNode;
  /** Shared form action handlers and state */
  actions: SharedActions;
  /** Whether this tab has a next tab in sequence */
  hasNext?: boolean;
  /** Whether this tab has a previous tab in sequence */
  hasBack?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

export function TabContainer({
  children,
  actions,
  hasNext = false,
  hasBack = false,
  className = '',
}: TabContainerProps) {
  return (
    <div className={`space-y-6 px-4 sm:px-6 pb-6 ${className}`}>
      {/* Tab-Specific Content */}
      <div role="region" aria-label="Tab content">
        {children}
      </div>

      {/* Form Actions */}
      <FormActions {...actions} hasNext={hasNext} hasBack={hasBack} />
    </div>
  );
}
