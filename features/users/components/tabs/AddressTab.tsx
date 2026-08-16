import { memo } from 'react';
import { AddressFields } from '@/shared/ui/molecules/AddressFields';
import { TabContainer } from '../TabContainer';
import type { SharedActions } from '../../types/profile.types';
import { MapPin } from 'lucide-react';

interface AddressTabProps {
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
 * Address tab component
 *
 * Renders address input fields within the tab container.
 * Fields are disabled when not in edit mode.
 * Memoized to prevent unnecessary re-renders.
 */
export const AddressTab = memo(function AddressTab({
  actions,
  hasNext = false,
  hasBack = false,
}: AddressTabProps) {
  const isDisabled = !actions.isEditing;

  return (
    <TabContainer actions={actions} hasNext={hasNext} hasBack={hasBack}>
        <div className="space-y-6">
          <AddressFields disabled={isDisabled} showTitle={false} />
        </div>

        {/* Onboarding Shipping Tip Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs font-semibold text-slate-350 shadow-md">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 animate-pulse text-blue-500" />
          <div>
            <span className="font-bold text-blue-500">Shipping Tip:</span> Ensure your pincode
            matches your city and locality exactly to avoid carrier delays on package delivery.
          </div>
        </div>
    </TabContainer>
  );
});

AddressTab.displayName = 'AddressTab';
