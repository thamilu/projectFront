import { Palette, Globe, Bell, Eye, Layout, Lock, HelpCircle, type LucideIcon } from 'lucide-react';

export interface SettingsTab {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export const SETTINGS_TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language & Region', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'accessibility', label: 'Accessibility', icon: Eye },
  { id: 'display', label: 'Display', icon: Layout },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
] as const satisfies readonly SettingsTab[];

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];
