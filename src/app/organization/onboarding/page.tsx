"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { updateMyOrganization } from "@/lib/api";

type Market = "PK" | "AE" | "GB" | "US";
type MeasurementSystem = "pk_traditional" | "imperial" | "metric";

interface MarketConfig {
  label: string;
  currency: string;
  measurement: MeasurementSystem;
  language: string;
  timezone: string;
}

const MARKET_CONFIGS: Record<Market, MarketConfig> = {
  PK: { label: "Pakistan",      currency: "PKR", measurement: "pk_traditional", language: "ur", timezone: "Asia/Karachi" },
  AE: { label: "UAE",           currency: "AED", measurement: "imperial",        language: "ar", timezone: "Asia/Dubai" },
  GB: { label: "United Kingdom", currency: "GBP", measurement: "metric",         language: "en", timezone: "Europe/London" },
  US: { label: "United States", currency: "USD", measurement: "imperial",        language: "en", timezone: "America/New_York" },
};

const MEASUREMENT_LABELS: Record<MeasurementSystem, string> = {
  pk_traditional: "Marla / Kanal (Pakistan Traditional)",
  imperial:       "Square Feet / Square Yards",
  metric:         "Square Metres",
};

const steps = ["Market", "Defaults", "Confirm"] as const;

export default function OrgOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [market, setMarket] = useState<Market>("AE");
  const [currency, setCurrency] = useState(MARKET_CONFIGS.AE.currency);
  const [measurement, setMeasurement] = useState<MeasurementSystem>(MARKET_CONFIGS.AE.measurement);
  const [language, setLanguage] = useState(MARKET_CONFIGS.AE.language);
  const [timezone, setTimezone] = useState(MARKET_CONFIGS.AE.timezone);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyOrganization({ country: market, currency, measurement_system: measurement, language, timezone }),
    onSuccess: () => router.push("/organization"),
  });

  function applyMarketDefaults(m: Market) {
    const cfg = MARKET_CONFIGS[m];
    setMarket(m);
    setCurrency(cfg.currency);
    setMeasurement(cfg.measurement);
    setLanguage(cfg.language);
    setTimezone(cfg.timezone);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-gray-900 rounded-2xl border border-gray-800 p-8">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
                ${i < step ? "bg-blue-600 text-white" : i === step ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-500"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === step ? "text-white" : "text-gray-500"}`}>{s}</span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-800 ms-2" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Market */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Select your market</h2>
              <p className="text-sm text-gray-400 mt-1">This sets your default currency, measurement units, and language.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(MARKET_CONFIGS) as [Market, MarketConfig][]).map(([code, cfg]) => (
                <button
                  key={code}
                  onClick={() => applyMarketDefaults(code)}
                  className={`p-4 rounded-xl border text-start transition-colors
                    ${market === code ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-600"}`}
                >
                  <p className="font-medium text-white">{cfg.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{cfg.currency} · {MEASUREMENT_LABELS[cfg.measurement].split(" (")[0]}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2 — Defaults */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Configure defaults</h2>
              <p className="text-sm text-gray-400 mt-1">Adjust any pre-filled values for your market.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {["AED","PKR","GBP","USD","EUR"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Area measurement</label>
                <select
                  value={measurement}
                  onChange={(e) => setMeasurement(e.target.value as MeasurementSystem)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {(Object.entries(MEASUREMENT_LABELS) as [MeasurementSystem, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">AI response language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {[["en","English"],["ar","Arabic (العربية)"],["ur","Urdu (اردو)"]].map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {[
                    ["Asia/Dubai","Asia/Dubai (UAE)"],
                    ["Asia/Karachi","Asia/Karachi (Pakistan)"],
                    ["Europe/London","Europe/London (UK)"],
                    ["America/New_York","America/New_York (US Eastern)"],
                    ["America/Los_Angeles","America/Los_Angeles (US Pacific)"],
                  ].map(([tz, label]) => (
                    <option key={tz} value={tz}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3 border border-gray-700 text-gray-300 hover:text-white rounded-xl font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Confirm configuration</h2>
              <p className="text-sm text-gray-400 mt-1">Review your settings before saving.</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 space-y-3 text-sm">
              {[
                ["Market", MARKET_CONFIGS[market].label],
                ["Currency", currency],
                ["Area Units", MEASUREMENT_LABELS[measurement]],
                ["AI Language", language],
                ["Timezone", timezone],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>

            {saveMutation.isError && (
              <p className="text-red-400 text-sm">Failed to save. Please try again.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={saveMutation.isPending}
                className="flex-1 py-3 border border-gray-700 text-gray-300 hover:text-white rounded-xl font-medium disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
