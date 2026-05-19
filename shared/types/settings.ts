export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  fontSize: number;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  display: DisplaySettings;
  sound: boolean;
  autoplay: boolean;
  accentColor: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  deals: boolean;
  orders: boolean;
  newsletter: boolean;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
}

export interface DisplaySettings {
  compactMode: boolean;
  showPrices: boolean;
  showRatings: boolean;
  gridColumns: number;
}
