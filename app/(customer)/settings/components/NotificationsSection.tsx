'use client';

import React, { useState } from 'react';
import { Bell, Mail, Smartphone, ShoppingBag, Sparkles } from 'lucide-react';
import { Switch } from '@/shared/ui/atoms/switch';
import { SettingsSection, SettingsRow } from '@/shared/ui/settings';
import { ComingSoonNotice } from './ComingSoonNotice';
import type { NotificationPreferences } from './types';

interface NotificationsSectionProps {
  initialPreferences?: Partial<NotificationPreferences>;
  onSave?: (prefs: NotificationPreferences) => Promise<void>;
}

const DEFAULT_PREFS: NotificationPreferences = {
  emailOrders: true,
  emailSecurity: true,
  emailDigest: false,
  pushTracking: true,
  pushDeals: true,
  smsDispatch: false,
  marketingNews: false,
};

export function NotificationsSection({
  initialPreferences = DEFAULT_PREFS,
  onSave,
}: NotificationsSectionProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...DEFAULT_PREFS,
    ...initialPreferences,
  });
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real backend persistence hangs entirely off the optional `onSave` prop —
  // when a caller supplies one (once a real preferences endpoint exists),
  // the optimistic-update-with-rollback flow below already works correctly
  // as designed. Nothing today (page.tsx renders this with no onSave) means
  // toggles previously simulated a save with a bare setTimeout and reset
  // silently on reload; this now shows ComingSoonNotice and leaves the
  // toggle in its optimistic state without pretending a save happened.
  const handleToggle = async (key: keyof NotificationPreferences, nextVal: boolean) => {
    setErrorMessage(null);

    if (!onSave) {
      setPreferences((prev) => ({ ...prev, [key]: nextVal }));
      return;
    }

    const previousVal = preferences[key];
    setLoadingKey(key);
    setPreferences((prev) => ({ ...prev, [key]: nextVal }));

    try {
      await onSave({ ...preferences, [key]: nextVal });
    } catch {
      setPreferences((prev) => ({ ...prev, [key]: previousVal }));
      setErrorMessage(`Failed to update ${key} preference. Reverted to previous state.`);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <SettingsSection
      id="notifications"
      title="Notifications"
      description="Configure your order alerts, delivery tracking, and communication preferences"
      icon={Bell}
    >
      {!onSave && <ComingSoonNotice feature="Saving notification preferences" />}

      {errorMessage && (
        <div
          className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        {/* Email Orders */}
        <SettingsRow
          icon={Mail}
          title="Email Notifications"
          description="Receive order receipts, tracking confirmations, and critical security notices"
          control={
            <Switch
              checked={preferences.emailOrders}
              onChange={(e) => handleToggle('emailOrders', e.target.checked)}
              disabled={loadingKey === 'emailOrders'}
              aria-label="Toggle Email Notifications"
            />
          }
        />

        {/* Push Tracking */}
        <SettingsRow
          icon={ShoppingBag}
          title="Order & Shipment Tracking"
          description="Real-time push notifications for dispatch updates, package arrivals, and transit changes"
          control={
            <Switch
              checked={preferences.pushTracking}
              onChange={(e) => handleToggle('pushTracking', e.target.checked)}
              disabled={loadingKey === 'pushTracking'}
              aria-label="Toggle Order Tracking Alerts"
            />
          }
        />

        {/* SMS Notifications */}
        <SettingsRow
          icon={Smartphone}
          title="SMS Text Notifications"
          description="Receive delivery driver OTPs and final-mile dispatch updates via SMS text"
          control={
            <Switch
              checked={preferences.smsDispatch}
              onChange={(e) => handleToggle('smsDispatch', e.target.checked)}
              disabled={loadingKey === 'smsDispatch'}
              aria-label="Toggle SMS Notifications"
            />
          }
        />

        {/* Marketing Promotions */}
        <SettingsRow
          icon={Sparkles}
          title="Marketing & Exclusive Deals"
          description="Personalized deal recommendations, special seasonal sales, and member-only promotions"
          control={
            <Switch
              checked={preferences.marketingNews}
              onChange={(e) => handleToggle('marketingNews', e.target.checked)}
              disabled={loadingKey === 'marketingNews'}
              aria-label="Toggle Marketing & Deals"
            />
          }
        />
      </div>
    </SettingsSection>
  );
}
