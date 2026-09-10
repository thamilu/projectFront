/**
 * PersonalTab.tsx
 *
 * Personal information tab for user profile.
 * Displays user name, contact details, DOB, gender, and preferred language.
 */

import { memo } from 'react';
import { TabContainer } from '../TabContainer';
import { PersonalFields } from './components/PersonalFields';
import type { SharedActions } from '../../types/profile.types';

interface PersonalTabProps {
  /**
   * Shared form action handlers and state
   */
  actions: SharedActions;

  /**
   * Whether this tab has a next tab
   * @default false
   */
  hasNext?: boolean;

  /**
   * Whether this tab has a previous tab
   * @default false
   */
  hasBack?: boolean;
}

/**
 * Personal information tab component
 *
 * Renders personal profile input fields within the tab container.
 * Fields are disabled when not in edit mode.
 * Memoized to prevent unnecessary re-renders.
 *
 * @example
 * ```tsx
 * <PersonalTab
 *   actions={sharedActions}
 *   hasNext
 * />
 * ```
 */
export const PersonalTab = memo(function PersonalTab({
  actions,
  hasNext = false,
  hasBack = false,
}: PersonalTabProps) {
  const isDisabled = !actions.isEditing;

  return (
    <TabContainer actions={actions} hasNext={hasNext} hasBack={hasBack}>
      <div role="group" aria-label="Personal information">
        <PersonalFields disabled={isDisabled} />
      </div>
    </TabContainer>
  );
});

PersonalTab.displayName = 'PersonalTab';
