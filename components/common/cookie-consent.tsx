/**
 * Cookie Consent Component
 * 
 * GDPR-compliant cookie consent banner with granular preferences.
 * Stores user preferences in localStorage and cookies.
 * 
 * @module components/common/cookie-consent
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { announce } from './screen-reader-announcer';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_VERSION = '1.0';

/**
 * Get stored cookie consent
 */
function getCookieConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const consent = localStorage.getItem(CONSENT_COOKIE_NAME);
    if (!consent) return null;

    const parsed = JSON.parse(consent);
    if (parsed.version !== CONSENT_VERSION) return null;

    return parsed.preferences;
  } catch {
    return null;
  }
}

/**
 * Store cookie consent
 */
function setCookieConsent(preferences: CookiePreferences): void {
  const consentData = {
    version: CONSENT_VERSION,
    preferences,
    timestamp: new Date().toISOString(),
  };

  // Store in localStorage
  localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(consentData));

  // Set cookie for server-side reading
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${CONSENT_COOKIE_NAME}=${JSON.stringify(
    preferences
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Cookie Consent Component
 * 
 * Displays GDPR-compliant cookie consent banner with customization options.
 * 
 * @example
 * ```tsx
 * <CookieConsent />
 * ```
 */
export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setCookieConsent(allAccepted);
    setIsVisible(false);
    announce('All cookies accepted');
  }, []);

  const handleRejectAll = useCallback(() => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setCookieConsent(onlyNecessary);
    setIsVisible(false);
    announce('Only necessary cookies accepted');
  }, []);

  const handleSavePreferences = useCallback(() => {
    setCookieConsent(preferences);
    setIsVisible(false);
    announce('Cookie preferences saved');
  }, [preferences]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6"
    >
      <Card className="mx-auto max-w-2xl shadow-lg">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRejectAll}
            aria-label="Close and reject non-essential cookies"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary" />
            <CardTitle id="cookie-consent-title">Cookie Preferences</CardTitle>
          </div>
          <CardDescription id="cookie-consent-description">
            We use cookies to enhance your experience, analyze site usage, and
            deliver personalized content. Choose your preferences below.
          </CardDescription>
        </CardHeader>

        {showDetails && (
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="necessary-cookies" className="font-medium">
                  Necessary Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required for the website to function properly. Cannot be
                  disabled.
                </p>
              </div>
              <Switch
                id="necessary-cookies"
                checked
                disabled
                aria-label="Necessary cookies (required)"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="analytics-cookies" className="font-medium">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how you use our website to improve your
                  experience.
                </p>
              </div>
              <Switch
                id="analytics-cookies"
                checked={preferences.analytics}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                }
                aria-label="Analytics cookies"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-cookies" className="font-medium">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used to deliver personalized advertisements relevant to your
                  interests.
                </p>
              </div>
              <Switch
                id="marketing-cookies"
                checked={preferences.marketing}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                }
                aria-label="Marketing cookies"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="preference-cookies" className="font-medium">
                  Preference Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Remember your preferences and settings for a personalized
                  experience.
                </p>
              </div>
              <Switch
                id="preference-cookies"
                checked={preferences.preferences}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPreferences((prev) => ({ ...prev, preferences: e.target.checked }))
                }
                aria-label="Preference cookies"
              />
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="link"
            onClick={() => setShowDetails(!showDetails)}
            className="order-last sm:order-first"
          >
            {showDetails ? 'Hide details' : 'Customize preferences'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRejectAll}>
              Reject All
            </Button>
            {showDetails ? (
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            ) : (
              <Button onClick={handleAcceptAll}>Accept All</Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
