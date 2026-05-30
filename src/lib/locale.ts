const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

/** Returns true for right-to-left language codes (BCP-47 primary subtag). */
export function isRTLLocale(lang: string): boolean {
  return RTL_LANGS.has((lang || '').split('-')[0].toLowerCase());
}
