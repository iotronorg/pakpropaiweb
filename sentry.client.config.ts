import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  ignoreErrors: [
    // Browser noise — not actionable
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    /^NetworkError/,
    /^Failed to fetch/,
    /^Load failed/,
    "AbortError",
  ],

  beforeSend(event) {
    // Drop events with no stack trace (minification noise)
    if (!event.exception?.values?.[0]?.stacktrace?.frames?.length) {
      return null;
    }
    return event;
  },

  debug: false,
});
