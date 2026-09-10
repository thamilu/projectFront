'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { en, Dictionary } from './locales/en';
import { hi } from './locales/hi';

export type Locale = 'en' | 'hi';

const dictionaries: Record<Locale, Dictionary> = {
  en,
  hi,
};

interface I18nContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

// Force Turbopack re-evaluation for nested locale dictionaries (verified.title, setup.title, costs.title)
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load language from storage/cookie if exists
  useEffect(() => {
    const savedLocale = localStorage.getItem('eshop_locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'hi')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('eshop_locale', newLocale);
    document.cookie = `eshop_locale=${newLocale}; path=/; max-age=31536000`; // 1 year cookie
  };

  // Type-safe dynamic translator with parameter interpolation
  const t = (keyPath: string, params?: Record<string, string | number>): string => {
    // Normalize locale to 2-letter language code and fallback to 'en'
    const langCode = ((locale || 'en').split('-')[0].toLowerCase() as Locale) === 'hi' ? 'hi' : 'en';
    const dict = dictionaries[langCode] || dictionaries['en'];
    const keys = keyPath.split('.');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return keyPath; // fallback to key path if translation missing
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let translated = current;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        translated = translated.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }

    return translated;
  };

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
