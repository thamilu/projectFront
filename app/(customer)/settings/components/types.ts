/**
 * Enterprise Settings Domain Contracts & Types
 */

export interface UserAccountSummary {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: string;
  isEmailVerified: boolean;
  memberSince?: string;
}

export type SettingsSectionId =
  | 'appearance'
  | 'notifications'
  | 'security'
  | 'regional'
  | 'privacy'
  | 'danger-zone';

export type ThemeOption = 'light' | 'dark' | 'system';

export interface NotificationPreferences {
  emailOrders: boolean;
  emailSecurity: boolean;
  emailDigest: boolean;
  pushTracking: boolean;
  pushDeals: boolean;
  smsDispatch: boolean;
  marketingNews: boolean;
}

export interface MfaCapability {
  id: 'totp' | 'sms' | 'security_key';
  label: string;
  description: string;
  enabled: boolean;
  supportedByBackend: boolean;
}

export interface LoginActivityEvent {
  id: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  device: string;
  status: 'SUCCESS' | 'FAILED' | 'CHALLENGE_REQUIRED';
}

export interface RegionalPreferences {
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
}

export type ProfileVisibilityOption = 'PUBLIC' | 'REGISTERED' | 'PRIVATE';

export interface PrivacyPreferences {
  profileVisibility: ProfileVisibilityOption;
  activityStatus: boolean;
  personalizedAds: boolean;
  searchIndexing: boolean;
}

export interface DataExportScope {
  profile: boolean;
  orders: boolean;
  addresses: boolean;
  reviews: boolean;
  activityLogs: boolean;
}
