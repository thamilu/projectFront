'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, PauseCircle } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { SettingsSection, SettingsRow } from '@/shared/ui/settings';
import { DeleteAccountModal } from './modals/DeleteAccountModal';
import { DataAccessModal } from './modals/DataAccessModal';
import { ComingSoonNotice } from './ComingSoonNotice';

interface DangerZoneSectionProps {
  username?: string;
}

export function DangerZoneSection({ username }: DangerZoneSectionProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dataAccessOpen, setDataAccessOpen] = useState(false);

  return (
    <>
      <SettingsSection
        id="danger-zone"
        title="Danger Zone & Account Controls"
        description="Irreversible actions and temporary account deactivation controls. Exercise caution before proceeding."
        icon={AlertTriangle}
        variant="destructive"
      >
        <ComingSoonNotice feature="Account deactivation and deletion" />

        <div className="space-y-3">
          {/* Temporary Deactivation */}
          <SettingsRow
            icon={PauseCircle}
            title="Temporarily Deactivate Account"
            description="Pause your account visibility, mute notifications, and disable store browsing. Re-login anytime to restore."
            control={
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Not available yet"
                className="h-9 text-xs font-medium border-border/80"
              >
                Deactivate
              </Button>
            }
          />

          {/* Permanent Deletion */}
          <SettingsRow
            icon={Trash2}
            title="Permanently Delete Account"
            description="Permanently erase all personal profile data, addresses, and wishlist items. Past tax invoices retained per statutory requirements."
            control={
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="h-9 text-xs font-medium"
              >
                Delete Account
              </Button>
            }
          />
        </div>
      </SettingsSection>

      <DeleteAccountModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        username={username}
        onRequestDataExport={() => setDataAccessOpen(true)}
      />

      <DataAccessModal open={dataAccessOpen} onOpenChange={setDataAccessOpen} />
    </>
  );
}
