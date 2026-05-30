"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "realtron_cookie_consent";

export type ConsentChoice = "all" | "essential";

interface CookieConsent {
  consent:          ConsentChoice | null;
  analyticsAllowed: boolean;
  marketingAllowed: boolean;
  hasDecided:       boolean;
  accept:           (choice: ConsentChoice) => void;
}

export function useCookieConsent(): CookieConsent {
  const [consent, setConsent] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY) as ConsentChoice | null;
      if (stored === "all" || stored === "essential") {
        setConsent(stored);
      }
    } catch {
      // localStorage unavailable (SSR guard, private browsing, etc.)
    }
  }, []);

  const accept = (choice: ConsentChoice) => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // ignore write failures
    }
    setConsent(choice);
  };

  return {
    consent,
    analyticsAllowed: consent === "all",
    marketingAllowed: consent === "all",
    hasDecided:       consent !== null,
    accept,
  };
}
