"use client";

import { LOCALE_COOKIE, type Locale } from "./config";

/** Set locale cookie and reload to apply new language + RTL direction. */
export function setLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  window.location.reload();
}
