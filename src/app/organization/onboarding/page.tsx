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
  PK:    { label: "Pakistan",        currency: "PKR", measurement: "pk_traditional", language: "ur", timezone: "Asia/Karachi" },
  AE:    { label: "UAE",             currency: "AED", measurement: "imperial",        language: "ar", timezone: "Asia/Dubai" },
  GB:    { label: "United Kingdom",  currency: "GBP", measurement: "metric",          language: "en", timezone: "Europe/London" },
  US:    { label: "United States",   currency: "USD", measurement: "imperial",        language: "en", timezone: "America/New_York" },
  other: { label: "Other / Global",  currency: "USD", measurement: "metric",          language: "en", timezone: "UTC" },
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
};

const CURRENCIES = ["AED", "PKR", "GBP", "USD", "EUR", "SAR", "CAD", "AUD", "SGD", "INR"];

const TIMEZONES: [string, string][] = [
  ["Asia/Dubai",         "Asia/Dubai (UAE)"],
  ["Asia/Karachi",       "Asia/Karachi (Pakistan)"],
  ["Europe/London",      "Europe/London (UK)"],
  ["America/New_York",   "America/New_York (US Eastern)"],
  ["America/Los_Angeles","America/Los_Angeles (US Pacific)"],
  ["Europe/Berlin",      "Europe/Berlin (CET)"],
  ["Asia/Singapore",     "Asia/Singapore (SGT)"],
  ["UTC",                "UTC (Coordinated Universal Time)"],
];

const STEPS = ["Market", "Defaults", "Confirm"] as const;

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
};

export default function OrgOnboardingPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);

  const [market, setMarket]           = useState<Market>("AE");
  const [currency, setCurrency]       = useState(MARKET_CONFIGS.AE.currency);
  const [measurement, setMeasurement] = useState<MeasurementSystem>(MARKET_CONFIGS.AE.measurement);
  const [language, setLanguage]       = useState(MARKET_CONFIGS.AE.language);
  const [timezone, setTimezone]       = useState(MARKET_CONFIGS.AE.timezone);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyOrganization({
        country: market === "other" ? "" : market,
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
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Branding */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm" aria-hidden="true">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-lg text-white">RealTron<span className="text-blue-400"> AI</span></span>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">

          {/* Step progress */}
          <nav aria-label="Setup progress" className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    i < step  ? "bg-blue-600 text-white"
                    : i === step ? "bg-blue-500 text-white ring-2 ring-blue-400/30"
                    : "bg-slate-800 text-slate-500"
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {i < step
                    ? <Check size={14} aria-hidden="true" />
                    : <span className="text-sm font-semibold">{i + 1}</span>
                  }
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-white" : "text-slate-500"}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-slate-800 ms-2" aria-hidden="true" />
                )}
              </div>
            ))}
          </nav>

          {/* Steps with animated transitions */}
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
                  <h2 className="text-xl font-semibold text-white">Select your market</h2>
                  <p className="text-sm text-slate-400 mt-1">
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
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                      }`}
                    >
                      {code === "other"
                        ? <Globe size={15} className="text-slate-400 mb-2" aria-hidden="true" />
                        : null}
                      <p className="font-medium text-white text-sm">{cfg.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
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
                  <h2 className="text-xl font-semibold text-white">Configure defaults</h2>
                  <p className="text-sm text-slate-400 mt-1">Adjust any pre-filled values for your specific setup.</p>
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
                  <button type="button" onClick={() => navigate(0)}
                    className="flex-1 py-3 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-xl font-medium transition-colors">
                    Back
                  </button>
                  <button type="button" onClick={() => navigate(2)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
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
                  <h2 className="text-xl font-semibold text-white">Confirm configuration</h2>
                  <p className="text-sm text-slate-400 mt-1">Review your settings. You can change these later in Organization Settings.</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 space-y-3 text-sm" role="list">
                  {[
                    ["Market",       MARKET_CONFIGS[market].label],
                    ["Currency",     currency],
                    ["Area Units",   MEASUREMENT_LABELS[measurement]],
                    ["AI Language",  LANGUAGE_LABELS[language] ?? language],
                    ["Timezone",     timezone],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between" role="listitem">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {saveMutation.isError && (
                  <p role="alert" className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    Failed to save. Please try again.
                  </p>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => navigate(1)}
                    disabled={saveMutation.isPending}
                    className="flex-1 py-3 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50">
                    Back
                  </button>
                  <button type="button" onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saveMutation.isPending
                      ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Saving…</>
                      : "Save & Continue"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-slate-600">
            Already configured?{" "}
            <Link href="/organization" className="text-slate-400 hover:text-white transition-colors">
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
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      >
        {children}
      </select>
    </div>
  );
}
