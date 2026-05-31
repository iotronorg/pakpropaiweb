"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Check, ChevronRight, Loader2, Globe } from "lucide-react";
import { updateMyOrganization } from "@/lib/api";

type Market = "PK" | "AE" | "GB" | "US" | "other";
type MeasurementSystem = "pk_traditional" | "imperial" | "metric";

interface MarketConfig {
  label: string;
  currency: string;
  measurement: MeasurementSystem;
  language: string;
  timezone: string;
}

const MARKET_CONFIGS: Record<Market, MarketConfig> = {
  PK:    { label: "Pakistan",       currency: "PKR", measurement: "pk_traditional", language: "ur", timezone: "Asia/Karachi"   },
  AE:    { label: "UAE",            currency: "AED", measurement: "imperial",        language: "ar", timezone: "Asia/Dubai"     },
  GB:    { label: "United Kingdom", currency: "GBP", measurement: "metric",          language: "en", timezone: "Europe/London"  },
  US:    { label: "United States",  currency: "USD", measurement: "imperial",        language: "en", timezone: "America/New_York" },
  other: { label: "Other / Global", currency: "USD", measurement: "metric",          language: "en", timezone: "UTC"            },
};

const MEASUREMENT_LABELS: Record<MeasurementSystem, string> = {
  pk_traditional: "Marla / Kanal (Pakistan Traditional)",
  imperial:       "Square Feet / Square Yards",
  metric:         "Square Metres",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "Arabic (العربية)",
  ur: "Urdu (اردو)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  es: "Spanish (Español)",
  tr: "Turkish (Türkçe)",
  hi: "Hindi (हिन्दी)",
  ms: "Malay (Bahasa Melayu)",
  zh: "Chinese Simplified (中文)",
  pt: "Portuguese (Português)",
  nl: "Dutch (Nederlands)",
  sw: "Swahili (Kiswahili)",
};

const CURRENCIES = ["AED", "PKR", "GBP", "USD", "EUR", "SAR", "CAD", "AUD", "SGD", "INR", "ZAR", "KES", "NGN", "TRY", "MYR", "BDT"];

const TIMEZONES: [string, string][] = [
  // Middle East
  ["Asia/Dubai",          "Asia/Dubai (UAE, +4)"],
  ["Asia/Riyadh",         "Asia/Riyadh (Saudi Arabia, +3)"],
  ["Asia/Qatar",          "Asia/Qatar (Qatar / Kuwait / Bahrain, +3)"],
  // South Asia
  ["Asia/Karachi",        "Asia/Karachi (Pakistan, +5)"],
  ["Asia/Kolkata",        "Asia/Kolkata (India, +5:30)"],
  ["Asia/Dhaka",          "Asia/Dhaka (Bangladesh, +6)"],
  // Southeast Asia
  ["Asia/Singapore",      "Asia/Singapore (SGT, +8)"],
  ["Asia/Kuala_Lumpur",   "Asia/Kuala_Lumpur (Malaysia, +8)"],
  // East Asia
  ["Asia/Shanghai",       "Asia/Shanghai (China, +8)"],
  // Europe
  ["Europe/London",       "Europe/London (UK, GMT/BST)"],
  ["Europe/Berlin",       "Europe/Berlin (CET, +1)"],
  ["Europe/Paris",        "Europe/Paris (CET, +1)"],
  ["Europe/Amsterdam",    "Europe/Amsterdam (CET, +1)"],
  ["Europe/Istanbul",     "Europe/Istanbul (Turkey, +3)"],
  // Americas
  ["America/New_York",    "America/New_York (US Eastern, -5)"],
  ["America/Chicago",     "America/Chicago (US Central, -6)"],
  ["America/Los_Angeles", "America/Los_Angeles (US Pacific, -8)"],
  ["America/Toronto",     "America/Toronto (Canada Eastern, -5)"],
  ["America/Vancouver",   "America/Vancouver (Canada Pacific, -8)"],
  // Africa
  ["Africa/Johannesburg", "Africa/Johannesburg (South Africa, +2)"],
  ["Africa/Nairobi",      "Africa/Nairobi (Kenya / East Africa, +3)"],
  ["Africa/Lagos",        "Africa/Lagos (Nigeria / West Africa, +1)"],
  // Oceania
  ["Australia/Sydney",    "Australia/Sydney (AEDT, +11)"],
  ["Australia/Perth",     "Australia/Perth (AWST, +8)"],
  // Universal
  ["UTC",                 "UTC (Coordinated Universal Time)"],
];

const STEPS = ["Market", "Defaults", "Confirm"] as const;

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ?  24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 :  24 }),
};

export default function OrgOnboardingPage() {
  const router        = useRouter();
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir,  setDir]  = useState(1);

  const [market,      setMarket]      = useState<Market>("AE");
  const [currency,    setCurrency]    = useState(MARKET_CONFIGS.AE.currency);
  const [measurement, setMeasurement] = useState<MeasurementSystem>(MARKET_CONFIGS.AE.measurement);
  const [language,    setLanguage]    = useState(MARKET_CONFIGS.AE.language);
  const [timezone,    setTimezone]    = useState(MARKET_CONFIGS.AE.timezone);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyOrganization({
        ...(market !== "other" && { country: market }),
        currency,
        measurement_system: measurement,
        language,
        timezone,
      }),
    onSuccess: () => router.push("/organization"),
  });

  function navigate(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function applyMarketDefaults(m: Market) {
    const cfg = MARKET_CONFIGS[m];
    setMarket(m);
    setCurrency(cfg.currency);
    setMeasurement(cfg.measurement);
    setLanguage(cfg.language);
    setTimezone(cfg.timezone);
  }

  const dur = prefersReduced ? 0 : 0.22;

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Branding */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm" aria-hidden="true">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-lg text-[var(--text-primary)]">RealTron<span className="text-blue-600"> AI</span></span>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-8 shadow-sm">

          {/* Step progress */}
          <nav aria-label="Setup progress" className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    i < step    ? "bg-blue-600 text-white"
                    : i === step ? "bg-blue-600 text-white ring-2 ring-blue-200"
                    : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {i < step
                    ? <Check size={14} aria-hidden="true" />
                    : <span className="text-sm font-semibold">{i + 1}</span>
                  }
                </div>
                <span className={`text-sm font-medium hidden sm:block ${
                  i === step ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                }`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-[var(--border)] ms-2" aria-hidden="true" />
                )}
              </div>
            ))}
          </nav>

          <AnimatePresence mode="wait" custom={dir}>

            {/* Step 1 — Market */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: dur, ease: "easeOut" }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Select your market</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Sets your default currency, area units, AI language, and compliance context. You can adjust individual settings in the next step.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Select primary market">
                  {(Object.entries(MARKET_CONFIGS) as [Market, MarketConfig][]).map(([code, cfg]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => applyMarketDefaults(code)}
                      aria-pressed={market === code}
                      className={`p-4 rounded-xl border text-start transition-colors ${
                        market === code
                          ? "border-blue-500 bg-blue-50"
                          : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-muted)]"
                      }`}
                    >
                      {code === "other"
                        ? <Globe size={15} className="text-[var(--text-muted)] mb-2" aria-hidden="true" />
                        : null}
                      <p className={`font-medium text-sm ${market === code ? "text-blue-700" : "text-[var(--text-primary)]"}`}>
                        {cfg.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${market === code ? "text-blue-600" : "text-[var(--text-muted)]"}`}>
                        {cfg.currency} · {MEASUREMENT_LABELS[cfg.measurement].split(" (")[0]}
                      </p>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(1)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Next <ChevronRight size={15} aria-hidden="true" />
                </button>
              </motion.div>
            )}

            {/* Step 2 — Defaults */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: dur, ease: "easeOut" }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Configure defaults</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Adjust any pre-filled values for your specific setup.</p>
                </div>

                <div className="space-y-4">
                  <SelectField label="Currency" value={currency} onChange={setCurrency}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </SelectField>

                  <SelectField label="Area measurement" value={measurement} onChange={(v) => setMeasurement(v as MeasurementSystem)}>
                    {(Object.entries(MEASUREMENT_LABELS) as [MeasurementSystem, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </SelectField>

                  <SelectField label="AI response language" value={language} onChange={setLanguage}>
                    {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </SelectField>

                  <SelectField label="Timezone" value={timezone} onChange={setTimezone}>
                    {TIMEZONES.map(([tz, label]) => (
                      <option key={tz} value={tz}>{label}</option>
                    ))}
                  </SelectField>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(0)}
                    className="flex-1 py-3 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] rounded-xl font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(2)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Next <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Confirm */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: dur, ease: "easeOut" }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Confirm configuration</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Review your settings. You can change these later in Organization Settings.</p>
                </div>

                <div className="bg-[var(--bg-muted)] rounded-xl p-4 space-y-3 text-sm border border-[var(--border)]" role="list">
                  {[
                    ["Market",      MARKET_CONFIGS[market].label],
                    ["Currency",    currency],
                    ["Area Units",  MEASUREMENT_LABELS[measurement]],
                    ["AI Language", LANGUAGE_LABELS[language] ?? language],
                    ["Timezone",    timezone],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between" role="listitem">
                      <span className="text-[var(--text-muted)]">{label}</span>
                      <span className="text-[var(--text-primary)] font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {saveMutation.isError && (
                  <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    Failed to save. Please try again.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(1)}
                    disabled={saveMutation.isPending}
                    className="flex-1 py-3 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saveMutation.isPending
                      ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Saving…</>
                      : "Save & Continue"}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
            Already configured?{" "}
            <Link href="/organization" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Go to dashboard →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-[var(--text-muted)] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      >
        {children}
      </select>
    </div>
  );
}
