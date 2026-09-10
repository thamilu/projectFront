import React from 'react';
import type { ProfileTab } from '../../utils/profile.constants';
import type { SharedActions } from '../../types/profile.types';
import { PROFILE_TABS } from '../../utils/profile.constants';

const PersonalTab = React.lazy(() =>
  import('../tabs/PersonalTab').then((m) => ({ default: m.PersonalTab }))
);
const AddressTab = React.lazy(() =>
  import('../tabs/AddressTab').then((m) => ({ default: m.AddressTab }))
);

export interface TabConfig {
  key: ProfileTab;
  motionKey: string;
  title: string;
  description: string;
  hasNext: boolean;
  hasBack: boolean;
  skeletonVariant: 'personal' | 'address';
  component: React.ComponentType<{
    actions: SharedActions;
    hasNext: boolean;
    hasBack: boolean;
  }>;
}

export const TAB_CONFIG: Record<ProfileTab, TabConfig> = {
  [PROFILE_TABS.PERSONAL]: {
    key: PROFILE_TABS.PERSONAL,
    motionKey: 'personal',
    title: 'Personal Information',
    description: 'Manage your core profile identity and contact details.',
    hasNext: true,
    hasBack: false,
    skeletonVariant: 'personal',
    component: PersonalTab,
  },
  [PROFILE_TABS.ADDRESS]: {
    key: PROFILE_TABS.ADDRESS,
    motionKey: 'address',
    title: 'Addresses',
    description: 'Your registered default addresses for order delivery and billing.',
    hasNext: false,
    hasBack: true,
    skeletonVariant: 'address',
    component: AddressTab,
  },
};
