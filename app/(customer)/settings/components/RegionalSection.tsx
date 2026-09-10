'use client';

import React, { useState } from 'react';
import { Globe, Languages, DollarSign, Clock, Calendar } from 'lucide-react';
import { ComingSoonNotice } from './ComingSoonNotice';
import { Button } from '@/shared/ui/atoms/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { SettingsSection, SettingsRow } from '@/shared/ui/settings';
import type { RegionalPreferences } from './types';

const LANGUAGES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'hi-IN', label: 'हिन्दी (Hindi - India)' },
  { value: 'es-ES', label: 'Español (Spanish)' },
  { value: 'fr-FR', label: 'Français (French)' },
  { value: 'de-DE', label: 'Deutsch (German)' },
  { value: 'ja-JP', label: '日本語 (Japanese)' },
];

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: '(GMT+05:30) India Standard Time (IST)' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'Europe/London', label: '(GMT+00:00) Greenwich Mean Time (London)' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Japan Standard Time (Tokyo)' },
  { value: 'UTC', label: '(GMT+00:00) Universal Coordinated Time (UTC)' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 20/08/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 08/20/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO 8601 standard)' },
];

export function RegionalSection() {
  const [prefs, setPrefs] = useState<RegionalPreferences>({
    language: 'en-US',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
  });
  return (
    <SettingsSection
      id="regional"
      title="Language & Regional Preferences"
      description="Configure your preferred interface language, display currency, timezone, and calendar date formats"
      icon={Globe}
      headerAction={
        <Button size="sm" disabled title="Not available yet" className="h-8 text-xs font-medium">
          Save Preferences
        </Button>
      }
    >
      <ComingSoonNotice feature="Saving regional preferences" />

      <div className="space-y-3">
        {/* Language Select */}
        <SettingsRow
          icon={Languages}
          title="Display Language"
          description="Choose the primary language used for browsing, search, and checkout"
          control={
            <div className="w-full sm:w-64">
              <Select
                value={prefs.language}
                onValueChange={(val) => setPrefs((p) => ({ ...p, language: val }))}
              >
                <SelectTrigger id="language-select" aria-label="Select Language" className="h-9 text-xs">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value} className="text-xs">
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Currency Select */}
        <SettingsRow
          icon={DollarSign}
          title="Preferred Currency"
          description="Prices and payment estimates will be calculated and presented in this currency"
          control={
            <div className="w-full sm:w-64">
              <Select
                value={prefs.currency}
                onValueChange={(val) => setPrefs((p) => ({ ...p, currency: val }))}
              >
                <SelectTrigger id="currency-select" aria-label="Select Currency" className="h-9 text-xs">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value} className="text-xs">
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Timezone Select */}
        <SettingsRow
          icon={Clock}
          title="Account Timezone"
          description="Used for order timeline timestamps, promotional deal countdowns, and delivery estimates"
          control={
            <div className="w-full sm:w-64">
              <Select
                value={prefs.timezone}
                onValueChange={(val) => setPrefs((p) => ({ ...p, timezone: val }))}
              >
                <SelectTrigger id="timezone-select" aria-label="Select Timezone" className="h-9 text-xs">
                  <SelectValue placeholder="Select Timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-xs">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Date Format Select */}
        <SettingsRow
          icon={Calendar}
          title="Date & Time Formatting"
          description="Standard date representation across invoice PDFs and order receipts"
          control={
            <div className="w-full sm:w-64">
              <Select
                value={prefs.dateFormat}
                onValueChange={(val) => setPrefs((p) => ({ ...p, dateFormat: val }))}
              >
                <SelectTrigger id="dateformat-select" aria-label="Select Date Format" className="h-9 text-xs">
                  <SelectValue placeholder="Select Date Format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value} className="text-xs">
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>
    </SettingsSection>
  );
}
