export interface Language {
  readonly code: 'en' | 'hi';
  readonly name: string;
  readonly flag: string;
  readonly locale: string;
}

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', locale: 'en-US' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', locale: 'hi-IN' },
] as const satisfies readonly Language[];

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
