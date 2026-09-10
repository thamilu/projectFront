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

      {/* Shipping Tip Banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <span className="font-semibold text-foreground">Delivery Tip:</span> Ensure your postal PIN code
          matches your city and locality to prevent carrier routing delays.
        </div>
      </div>
    </TabContainer>
  );
});

AddressTab.displayName = 'AddressTab';
