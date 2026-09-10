export interface LocaleConfig {
  /** Display name in the locale's own language */
  display: string;
  /** Display name in English (for aria-label target description) */
  englishName: string;
}

export const LOCALE_CONFIG: Record<string, LocaleConfig> = {
  en: { display: 'English', englishName: 'English' },
  hi: { display: 'हिन्दी', englishName: 'Hindi' },
} as const;

/** Fallback config for unrecognized locale codes */
export const LOCALE_FALLBACK: LocaleConfig = {
  display: 'Language',
  englishName: 'Language',
};

export type SupportedLocale = keyof typeof LOCALE_CONFIG;
