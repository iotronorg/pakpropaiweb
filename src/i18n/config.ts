export const locales = ['en', 'ur', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const RTL_LOCALES: Locale[] = ['ur', 'ar'];

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ur: 'اردو',
  ar: 'العربية',
};

export const LOCALE_COOKIE = 'realtron_locale';
