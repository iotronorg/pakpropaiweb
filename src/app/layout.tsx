import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { defaultLocale, isRTL, LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";
import { fetchTenantTheme, buildCssVars } from "@/lib/theme";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RealTron AI",
  description: "AI Sales Infrastructure for Real Estate Developers & Agencies",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value ?? defaultLocale;
  const locale: Locale = (locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : defaultLocale;

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const dir = isRTL(locale) ? "rtl" : "ltr";

  const host  = (await headers()).get('host') ?? ''
  const theme = await fetchTenantTheme(host)
  const css   = buildCssVars(theme)

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${css}}` }} />
      </head>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)]">
        {/* Skip-to-content for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[9999] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-md"
        >
          Skip to main content
        </a>
        <Providers locale={locale} messages={messages}>
          {children}
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
