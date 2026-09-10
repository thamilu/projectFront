'use client';

import React, { useState } from 'react';
import { Shield, Eye, Activity, FileDown, Search } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Switch } from '@/shared/ui/atoms/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { SettingsSection, SettingsRow } from '@/shared/ui/settings';
import { DataAccessModal } from './modals/DataAccessModal';
import { ComingSoonNotice } from './ComingSoonNotice';
import type { PrivacyPreferences, ProfileVisibilityOption } from './types';

const DEFAULT_PRIVACY: PrivacyPreferences = {
  profileVisibility: 'REGISTERED',
  activityStatus: true,
  personalizedAds: false,
  searchIndexing: false,
};

export function PrivacySection() {
  const [privacy, setPrivacy] = useState<PrivacyPreferences>(DEFAULT_PRIVACY);
  const [dataAccessOpen, setDataAccessOpen] = useState(false);

  const handleToggle = (key: keyof PrivacyPreferences, val: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <>
      <SettingsSection
        id="privacy"
        title="Privacy & Data Governance"
        description="Control your public profile visibility, online activity status, tracking preferences, and data portability requests"
        icon={Shield}
      >
        <ComingSoonNotice feature="Saving privacy preferences" />

        <div className="space-y-3">
          {/* Profile Visibility */}
          <SettingsRow
            icon={Eye}
            title="Profile Visibility"
            description="Control who can view your public reviews, seller ratings, and wishlist collections"
            control={
              <div className="w-full sm:w-56">
                <Select
                  value={privacy.profileVisibility}
                  onValueChange={(val: ProfileVisibilityOption) =>
                    setPrivacy((p) => ({ ...p, profileVisibility: val }))
                  }
                >
                  <SelectTrigger id="visibility-select" aria-label="Profile Visibility" className="h-9 text-xs">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC" className="text-xs">
                      Public (Everyone)
                    </SelectItem>
                    <SelectItem value="REGISTERED" className="text-xs">
                      Registered Users Only
                    </SelectItem>
                    <SelectItem value="PRIVATE" className="text-xs">
                      Private (Only Me)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />

          {/* Activity Status */}
          <SettingsRow
            icon={Activity}
            title="Activity Status"
            description="Show when you are actively online to customer support agents and connected store owners"
            control={
              <Switch
                checked={privacy.activityStatus}
                onChange={(e) => handleToggle('activityStatus', e.target.checked)}
                aria-label="Toggle Online Activity Status"
              />
            }
          />

          {/* Search Indexing */}
          <SettingsRow
            icon={Search}
            title="Search Engine Indexing"
            description="Allow public search engines like Google to index your public store reviews and public profile handle"
            control={
              <Switch
                checked={privacy.searchIndexing}
                onChange={(e) => handleToggle('searchIndexing', e.target.checked)}
                aria-label="Toggle Search Engine Indexing"
              />
            }
          />

          {/* Data Portability */}
          <SettingsRow
            icon={FileDown}
            title="Data Access & Export Request"
            description="Download a structured digital copy of your order archives, account records, and stored addresses"
            control={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDataAccessOpen(true)}
                className="h-9 text-xs font-medium"
              >
                <FileDown className="h-3.5 w-3.5 mr-1" />
                Request Data Export
              </Button>
            }
          />
        </div>
      </SettingsSection>

      <DataAccessModal open={dataAccessOpen} onOpenChange={setDataAccessOpen} />
    </>
  );
}
