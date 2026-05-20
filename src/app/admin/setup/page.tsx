"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfig, updateConfig } from "@/lib/api";
import { SystemConfig } from "@/types";

const SENTINEL = "__configured__";

const REQUIRED_LABELS: Record<string, string> = {
  wa_access_token: "WhatsApp Access Token",
  wa_phone_number_id: "WhatsApp Phone Number ID",
  wa_verify_token: "WhatsApp Verify Token",
  gemini_api_key: "Gemini API Key",
};

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Sensitive field input ─────────────────────────────────────────────────────
function SensitiveInput({
  fieldKey,
  originalValue,
  value,
  onChange,
  placeholder,
}: {
  fieldKey: string;
  originalValue: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  const isConfigured = originalValue === SENTINEL;

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isConfigured ? "Leave blank to keep current value" : placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-16 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ configured }: { configured: boolean }) {
  if (configured)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        ✓ Configured
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Not set
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SetupPage() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  // Local editable state per section
  const [waVals, setWaVals] = useState<Record<string, string>>({});
  const [aiVals, setAiVals] = useState<Record<string, string>>({});
  const [gwVal, setGwVal] = useState<string>("manual");
  const [gwCredsVals, setGwCredsVals] = useState<Record<string, string>>({});
  const [billingGwVal, setBillingGwVal] = useState<string>("manual");
  const [billingGwVals, setBillingGwVals] = useState<Record<string, string>>({});
  const [featureVals, setFeatureVals] = useState<Record<string, boolean>>({});
  const [scraperEnabled, setScraperEnabled] = useState(true);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  // Populate local state once config loads
  useEffect(() => {
    if (!config) return;
    setWaVals({
      wa_access_token:      config.wa_access_token === SENTINEL ? "" : config.wa_access_token,
      wa_phone_number_id:   config.wa_phone_number_id,
      wa_verify_token:      config.wa_verify_token,
      wa_app_secret:        config.wa_app_secret === SENTINEL ? "" : config.wa_app_secret,
      wa_otp_template_name: config.wa_otp_template_name,
    });
    setAiVals({
      gemini_api_key: config.gemini_api_key === SENTINEL ? "" : config.gemini_api_key,
      gemini_model:   config.gemini_model,
      ai_backend:     config.ai_backend,
      base_url:       config.base_url,
    });
    setBillingGwVal(config.billing_gateway ?? "manual");
    setBillingGwVals({
      stripe_secret_key:                config.stripe_secret_key === SENTINEL ? "" : (config.stripe_secret_key ?? ""),
      stripe_webhook_secret:            config.stripe_webhook_secret === SENTINEL ? "" : (config.stripe_webhook_secret ?? ""),
      stripe_price_basic:               config.stripe_price_basic ?? "",
      stripe_price_professional:        config.stripe_price_professional ?? "",
      stripe_price_enterprise:          config.stripe_price_enterprise ?? "",
      billing_price_basic_pkr:          config.billing_price_basic_pkr ?? "13000",
      billing_price_professional_pkr:   config.billing_price_professional_pkr ?? "40000",
      billing_price_enterprise_pkr:     config.billing_price_enterprise_pkr ?? "120000",
      // Safepay/bSecure keys reused from deal-lock section
      safepay_merchant_key:  config.safepay_merchant_key === SENTINEL ? "" : (config.safepay_merchant_key ?? ""),
      safepay_secret_key:    config.safepay_secret_key === SENTINEL ? "" : (config.safepay_secret_key ?? ""),
      safepay_environment:   config.safepay_environment ?? "sandbox",
      bsecure_client_id:     config.bsecure_client_id === SENTINEL ? "" : (config.bsecure_client_id ?? ""),
      bsecure_client_secret: config.bsecure_client_secret === SENTINEL ? "" : (config.bsecure_client_secret ?? ""),
      bsecure_environment:   config.bsecure_environment ?? "sandbox",
    });
    setGwVal(config.active_payment_gateway);
    setGwCredsVals({
      safepay_merchant_key:  config.safepay_merchant_key === SENTINEL ? "" : config.safepay_merchant_key,
      safepay_secret_key:    config.safepay_secret_key === SENTINEL ? "" : config.safepay_secret_key,
      safepay_environment:   config.safepay_environment,
      bsecure_client_id:     config.bsecure_client_id === SENTINEL ? "" : config.bsecure_client_id,
      bsecure_client_secret: config.bsecure_client_secret === SENTINEL ? "" : config.bsecure_client_secret,
      bsecure_environment:   config.bsecure_environment,
    });
    const fv: Record<string, boolean> = {};
    (Object.keys(config) as (keyof SystemConfig)[]).forEach((k) => {
      if (k.startsWith("feature_")) fv[k] = config[k] === "true";
    });
    setFeatureVals(fv);
    setScraperEnabled(config.scraper_search_enabled === "true");
  }, [config]);

  const mutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config"] });
      setTimeout(() => setSavedSection(null), 2500);
    },
  });

  function save(section: string, data: Record<string, string>) {
    // Strip empty-string values that are already configured (don't clear them)
    const payload: Record<string, string> = {};
    Object.entries(data).forEach(([k, v]) => {
      const original = (config as unknown as Record<string, string>)?.[k] ?? "";
      // If original was SENTINEL and new value is blank → skip (keep existing)
      if (original === SENTINEL && v === "") return;
      payload[k] = v;
    });
    setSavedSection(section);
    mutation.mutate(payload);
  }

  function saveFeatures() {
    const payload: Record<string, string> = {};
    Object.entries(featureVals).forEach(([k, v]) => {
      payload[k] = v ? "true" : "false";
    });
    payload.scraper_search_enabled = scraperEnabled ? "true" : "false";
    setSavedSection("features");
    mutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Loading configuration…
      </div>
    );
  }

  const missing = config?.missing_required ?? [];
  const setupComplete = config?.setup_complete ?? false;

  const FEATURE_DEFS: { key: keyof SystemConfig; label: string; desc: string }[] = [
    { key: "feature_property_search",       label: "Property Search",       desc: "Users can search listings by location, price, and type" },
    { key: "feature_property_listing",      label: "Property Listing",      desc: "Users can submit properties for sale via WhatsApp" },
    { key: "feature_tax_advice",            label: "Tax Advice",            desc: "Section 7E, CGT, and rental tax calculations" },
    { key: "feature_loan_eligibility",      label: "Loan Eligibility",      desc: "Apna Ghar scheme and bank eligibility checks" },
    { key: "feature_scam_check",            label: "Scam / Fraud Check",    desc: "Users can report deals or agents for fraud analysis" },
    { key: "feature_document_verification", label: "Document Verification", desc: "Users can send document photos for OCR verification" },
    { key: "feature_property_audit",        label: "Property Audit",        desc: "Full PDF audit reports with risk scores and investment grade" },
    { key: "feature_talk_to_agent",         label: "Talk to Agent",         desc: "Connect users with a verified local agent" },
    { key: "feature_deal_lock",             label: "Deal Lock",             desc: "Token payment to reserve a property for 48 hours" },
    { key: "feature_voice_messages",        label: "Voice Messages",        desc: "Transcribe and process voice notes from WhatsApp users" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Setup</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure API credentials, payment gateway, and WhatsApp feature availability
        </p>
      </div>

      {/* Setup warning banner */}
      {!setupComplete && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-800 mb-1">⚠️ System not fully configured</p>
          <p className="text-sm text-red-700 mb-2">
            The following required settings are missing. Fill them in to activate the WhatsApp bot:
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
            {missing.map((k) => (
              <li key={k}>{REQUIRED_LABELS[k] ?? k}</li>
            ))}
          </ul>
        </div>
      )}

      {setupComplete && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-3">
          <p className="text-sm font-semibold text-green-800">✓ System is fully configured</p>
          <p className="text-sm text-green-700">All required settings are in place. The WhatsApp bot is active.</p>
        </div>
      )}

      <div className="space-y-6">

        {/* ── Section 1: WhatsApp API ── */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">WhatsApp Cloud API</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Meta WhatsApp Business API credentials — required for the bot to send and receive messages
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { key: "wa_access_token",      label: "Access Token",      sensitive: true,  placeholder: "EAAxxxx…",          help: "Meta Dev Portal → WhatsApp → API Setup" },
              { key: "wa_phone_number_id",   label: "Phone Number ID",   sensitive: false, placeholder: "123456789",          help: "Shown under WhatsApp → API Setup in Meta Dev Portal" },
              { key: "wa_verify_token",      label: "Verify Token",      sensitive: false, placeholder: "my-secret-token",    help: "Any string — used when registering the webhook URL" },
              { key: "wa_app_secret",        label: "App Secret",        sensitive: true,  placeholder: "abcdef123…",         help: "App Settings → Basic → App Secret" },
              { key: "wa_otp_template_name", label: "OTP Template Name", sensitive: false, placeholder: "otp_verification",   help: "Template created in Meta Business Manager (must be approved)" },
            ].map(({ key, label, sensitive, placeholder, help }) => (
              <div key={key} className="px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  {sensitive && (
                    <StatusBadge configured={(config as unknown as Record<string, string>)?.[key] === SENTINEL} />
                  )}
                </div>
                {sensitive ? (
                  <SensitiveInput
                    fieldKey={key}
                    originalValue={(config as unknown as Record<string, string>)?.[key] ?? ""}
                    value={waVals[key] ?? ""}
                    onChange={(v) => setWaVals((prev) => ({ ...prev, [key]: v }))}
                    placeholder={placeholder}
                  />
                ) : (
                  <input
                    type="text"
                    value={waVals[key] ?? ""}
                    onChange={(e) => setWaVals((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )}
                {help && <p className="mt-1 text-xs text-gray-400">{help}</p>}
              </div>
            ))}
          </div>
          <SectionFooter
            saved={savedSection === "whatsapp"}
            saving={mutation.isPending && savedSection === "whatsapp"}
            onSave={() => save("whatsapp", waVals)}
          />
        </div>

        {/* ── Section 2: AI Backend ── */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">AI Backend</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Gemini (cloud) or Ollama (local) — controls which model powers the assistant
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Gemini API Key */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Gemini API Key</label>
                <StatusBadge configured={config?.gemini_api_key === SENTINEL} />
              </div>
              <SensitiveInput
                fieldKey="gemini_api_key"
                originalValue={config?.gemini_api_key ?? ""}
                value={aiVals.gemini_api_key ?? ""}
                onChange={(v) => setAiVals((p) => ({ ...p, gemini_api_key: v }))}
                placeholder="AIzaSy…"
              />
              <p className="mt-1 text-xs text-gray-400">Google AI Studio → Get API Key (free)</p>
            </div>
            {/* Gemini Model */}
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Gemini Model</label>
              <input
                type="text"
                value={aiVals.gemini_model ?? ""}
                onChange={(e) => setAiVals((p) => ({ ...p, gemini_model: e.target.value }))}
                placeholder="gemini-2.5-flash-lite"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">Default: gemini-2.5-flash-lite (free tier)</p>
            </div>
            {/* AI Backend */}
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Backend</label>
              <select
                value={aiVals.ai_backend ?? "gemini"}
                onChange={(e) => setAiVals((p) => ({ ...p, ai_backend: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="gemini">Gemini (cloud)</option>
                <option value="local">Local (Ollama)</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Use &apos;local&apos; for free unlimited testing with Ollama
              </p>
            </div>
            {/* Base URL */}
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Backend Base URL</label>
              <input
                type="text"
                value={aiVals.base_url ?? ""}
                onChange={(e) => setAiVals((p) => ({ ...p, base_url: e.target.value }))}
                placeholder="https://yourapp.onrender.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Public URL of this backend — used in WhatsApp PDF links and payment redirects
              </p>
            </div>
          </div>
          <SectionFooter
            saved={savedSection === "ai"}
            saving={mutation.isPending && savedSection === "ai"}
            onSave={() => save("ai", aiVals)}
          />
        </div>

        {/* ── Section 3: Billing Gateway ── */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">Billing Gateway</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Controls which gateway organizations use to upgrade their SaaS plan. Stripe for global payments; Safepay/bSecure for Pakistan.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Gateway selector */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { value: "stripe",  label: "Stripe",   desc: "Global recurring subscriptions" },
                { value: "safepay", label: "Safepay",  desc: "One-time payment (Pakistan)" },
                { value: "bsecure", label: "bSecure",  desc: "One-time payment (Pakistan)" },
                { value: "manual",  label: "Manual",   desc: "Admin upgrades plan in Django admin" },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBillingGwVal(value)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    billingGwVal === value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${billingGwVal === value ? "border-blue-500 bg-blue-500" : "border-gray-300"}`} />
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">{desc}</p>
                </button>
              ))}
            </div>

            {/* Stripe credentials */}
            {billingGwVal === "stripe" && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-4">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Stripe Credentials</p>
                <div className="space-y-3">
                  {[
                    { key: "stripe_secret_key",     label: "Secret Key",         sensitive: true,  placeholder: "sk_live_…",   help: "Stripe Dashboard → Developers → API keys" },
                    { key: "stripe_webhook_secret", label: "Webhook Secret",      sensitive: true,  placeholder: "whsec_…",     help: "Stripe Dashboard → Webhooks → endpoint secret" },
                    { key: "stripe_price_basic",         label: "Price ID — Basic",         sensitive: false, placeholder: "price_…",    help: "Monthly recurring price ID for Basic plan" },
                    { key: "stripe_price_professional",  label: "Price ID — Professional",  sensitive: false, placeholder: "price_…",    help: "Monthly recurring price ID for Professional plan" },
                    { key: "stripe_price_enterprise",    label: "Price ID — Enterprise",    sensitive: false, placeholder: "price_… (optional)", help: "Monthly recurring price ID for Enterprise plan" },
                  ].map(({ key, label, sensitive, placeholder, help }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">{label}</label>
                        {sensitive && <StatusBadge configured={(config as unknown as Record<string, string>)?.[key] === SENTINEL} />}
                      </div>
                      {sensitive ? (
                        <SensitiveInput
                          fieldKey={key}
                          originalValue={(config as unknown as Record<string, string>)?.[key] ?? ""}
                          value={billingGwVals[key] ?? ""}
                          onChange={(v) => setBillingGwVals((p) => ({ ...p, [key]: v }))}
                          placeholder={placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={billingGwVals[key] ?? ""}
                          onChange={(e) => setBillingGwVals((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                        />
                      )}
                      {help && <p className="mt-1 text-xs text-gray-400">{help}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-indigo-600 border-t border-indigo-100 pt-3">
                  Register webhook at: <code className="font-mono text-xs bg-indigo-100 px-1 rounded">POST /api/v1/billing/webhook/stripe/</code><br />
                  Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
                </p>
              </div>
            )}

            {/* Safepay billing credentials */}
            {billingGwVal === "safepay" && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Safepay Credentials</p>
                {[
                  { key: "safepay_merchant_key", label: "Merchant Key", sensitive: true,  placeholder: "sk_live_…" },
                  { key: "safepay_secret_key",   label: "Secret Key",   sensitive: true,  placeholder: "sk_…" },
                  { key: "safepay_environment",  label: "Environment",  sensitive: false, placeholder: "sandbox" },
                ].map(({ key, label, sensitive, placeholder }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">{label}</label>
                      {sensitive && <StatusBadge configured={(config as unknown as Record<string, string>)?.[key] === SENTINEL} />}
                    </div>
                    {sensitive ? (
                      <SensitiveInput
                        fieldKey={key}
                        originalValue={(config as unknown as Record<string, string>)?.[key] ?? ""}
                        value={billingGwVals[key] ?? ""}
                        onChange={(v) => setBillingGwVals((p) => ({ ...p, [key]: v }))}
                        placeholder={placeholder}
                      />
                    ) : (
                      <select
                        value={billingGwVals[key] ?? "sandbox"}
                        onChange={(e) => setBillingGwVals((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="sandbox">Sandbox (testing)</option>
                        <option value="production">Production (live)</option>
                      </select>
                    )}
                  </div>
                ))}
                <p className="text-xs text-blue-600 border-t border-blue-100 pt-3">
                  Register webhook at: <code className="font-mono text-xs bg-blue-100 px-1 rounded">POST /api/v1/billing/webhook/safepay/</code>
                </p>
                <BillingPkrPrices vals={billingGwVals} onChange={(k, v) => setBillingGwVals((p) => ({ ...p, [k]: v }))} />
              </div>
            )}

            {/* bSecure billing credentials */}
            {billingGwVal === "bsecure" && (
              <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">bSecure Credentials</p>
                {[
                  { key: "bsecure_client_id",     label: "Client ID",     sensitive: true,  placeholder: "bs_…" },
                  { key: "bsecure_client_secret",  label: "Client Secret", sensitive: true,  placeholder: "bs_secret_…" },
                  { key: "bsecure_environment",    label: "Environment",   sensitive: false, placeholder: "sandbox" },
                ].map(({ key, label, sensitive, placeholder }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">{label}</label>
                      {sensitive && <StatusBadge configured={(config as unknown as Record<string, string>)?.[key] === SENTINEL} />}
                    </div>
                    {sensitive ? (
                      <SensitiveInput
                        fieldKey={key}
                        originalValue={(config as unknown as Record<string, string>)?.[key] ?? ""}
                        value={billingGwVals[key] ?? ""}
                        onChange={(v) => setBillingGwVals((p) => ({ ...p, [key]: v }))}
                        placeholder={placeholder}
                      />
                    ) : (
                      <select
                        value={billingGwVals[key] ?? "sandbox"}
                        onChange={(e) => setBillingGwVals((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="sandbox">Sandbox (testing)</option>
                        <option value="production">Production (live)</option>
                      </select>
                    )}
                  </div>
                ))}
                <p className="text-xs text-purple-600 border-t border-purple-100 pt-3">
                  Register webhook at: <code className="font-mono text-xs bg-purple-100 px-1 rounded">POST /api/v1/billing/webhook/bsecure/</code>
                </p>
                <BillingPkrPrices vals={billingGwVals} onChange={(k, v) => setBillingGwVals((p) => ({ ...p, [k]: v }))} />
              </div>
            )}

            {billingGwVal === "manual" && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Manual mode — when an organization upgrades their plan, you will receive a notification and must activate the plan via Django admin.
              </div>
            )}
          </div>
          <SectionFooter
            saved={savedSection === "billing-gateway"}
            saving={mutation.isPending && savedSection === "billing-gateway"}
            onSave={() =>
              save("billing-gateway", {
                billing_gateway: billingGwVal,
                ...billingGwVals,
              })
            }
          />
        </div>

        {/* ── Section 5: Deal-Lock Payment Gateway ── */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">Deal-Lock Payment Gateway</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Gateway used for client token payments (deal lock feature). Separate from the SaaS billing gateway above.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Gateway radio buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "manual",  label: "Manual",  desc: "JazzCash / Bank Transfer — admin confirms manually" },
                { value: "safepay", label: "Safepay",  desc: "Online payment via Safepay (Pakistan)" },
                { value: "bsecure", label: "bSecure",  desc: "Online payment via bSecure (Pakistan)" },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGwVal(value)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    gwVal === value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                        gwVal === value ? "border-blue-500 bg-blue-500" : "border-gray-300"
                      }`}
                    />
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">{desc}</p>
                </button>
              ))}
            </div>

            {/* Safepay credentials (shown only when safepay selected) */}
            {gwVal === "safepay" && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Safepay Credentials</p>
                {[
                  { key: "safepay_merchant_key", label: "Merchant Key",  sensitive: true,  placeholder: "sk_live_…" },
                  { key: "safepay_secret_key",   label: "Secret Key",    sensitive: true,  placeholder: "sk_…" },
                  { key: "safepay_environment",  label: "Environment",   sensitive: false, placeholder: "sandbox" },
                ].map(({ key, label, sensitive, placeholder }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">{label}</label>
                      {sensitive && (
                        <StatusBadge configured={(config as unknown as Record<string, string>)?.[key] === SENTINEL} />
                      )}
                    </div>
                    {sensitive ? (
                      <SensitiveInput
                        fieldKey={key}
                        originalValue={(config as unknown as Record<string, string>)?.[key] ?? ""}
                        value={gwCredsVals[key] ?? ""}
                        onChange={(v) => setGwCredsVals((p) => ({ ...p, [key]: v }))}
                        placeholder={placeholder}
                      />
                    ) : (
                      <select
                        value={gwCredsVals[key] ?? "sandbox"}
                        onChange={(e) => setGwCredsVals((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="sandbox">Sandbox (testing)</option>
                        <option value="production">Production (live)</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* bSecure credentials */}
            {gwVal === "bsecure" && (
              <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">bSecure Credentials</p>
                {[
                  { key: "bsecure_client_id",     label: "Client ID",     sensitive: true,  placeholder: "bs_…" },
                  { key: "bsecure_client_secret",  label: "Client Secret", sensitive: true,  placeholder: "bs_secret_…" },
                  { key: "bsecure_environment",    label: "Environment",   sensitive: false, placeholder: "sandbox" },
                ].map(({ key, label, sensitive, placeholder }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">{label}</label>
                      {sensitive && (
                        <StatusBadge configured={(config as unknown as Record<string, string>)?.[key] === SENTINEL} />
                      )}
                    </div>
                    {sensitive ? (
                      <SensitiveInput
                        fieldKey={key}
                        originalValue={(config as unknown as Record<string, string>)?.[key] ?? ""}
                        value={gwCredsVals[key] ?? ""}
                        onChange={(v) => setGwCredsVals((p) => ({ ...p, [key]: v }))}
                        placeholder={placeholder}
                      />
                    ) : (
                      <select
                        value={gwCredsVals[key] ?? "sandbox"}
                        onChange={(e) => setGwCredsVals((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="sandbox">Sandbox (testing)</option>
                        <option value="production">Production (live)</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <SectionFooter
            saved={savedSection === "gateway"}
            saving={mutation.isPending && savedSection === "gateway"}
            onSave={() =>
              save("gateway", {
                active_payment_gateway: gwVal,
                ...gwCredsVals,
              })
            }
          />
        </div>

        {/* ── Section 6: WhatsApp Features ── */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">WhatsApp Features</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Enable or disable features visible to WhatsApp users. Disabled features are hidden from the greeting
              and cannot be used.
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURE_DEFS.map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    enabled={featureVals[key] ?? true}
                    onChange={(v) => setFeatureVals((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Search settings sub-section */}
          <div className="border-t border-gray-100 px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Search Settings</h3>
            <div className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-800">Allow third-party search</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  When enabled, searches also pull listings from Zameen, Graana, and OLX. When disabled,
                  only your own database listings are returned.
                </p>
              </div>
              <Toggle enabled={scraperEnabled} onChange={setScraperEnabled} />
            </div>
          </div>

          <SectionFooter
            saved={savedSection === "features"}
            saving={mutation.isPending && savedSection === "features"}
            onSave={saveFeatures}
          />
        </div>

      </div>
    </div>
  );
}

function BillingPkrPrices({
  vals,
  onChange,
}: {
  vals: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="border-t border-gray-200 pt-3 space-y-2">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Plan Prices (PKR / month)</p>
      {[
        { key: "billing_price_basic_pkr",        label: "Basic",        placeholder: "13000" },
        { key: "billing_price_professional_pkr", label: "Professional", placeholder: "40000" },
        { key: "billing_price_enterprise_pkr",   label: "Enterprise",   placeholder: "120000" },
      ].map(({ key, label, placeholder }) => (
        <div key={key} className="flex items-center gap-3">
          <label className="w-28 text-xs text-gray-600 shrink-0">{label}</label>
          <input
            type="number"
            min={0}
            value={vals[key] ?? ""}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500"
          />
        </div>
      ))}
    </div>
  );
}

function SectionFooter({
  saved,
  saving,
  onSave,
}: {
  saved: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
      {saved && !saving && (
        <span className="text-sm text-green-600 font-medium">Saved ✓</span>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
