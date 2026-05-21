"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrgConfig, updateOrgConfig, resetOrgConfigKey, getBillingUsage, getOrgPaymentSettings, updateOrgPaymentSettings, getBillingPortal } from "@/lib/api";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PricingModal } from "@/components/ui/PricingModal";
import type { BillingUsage, BillingDimension, OrgPaymentSettings } from "@/types";

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  trial: 'bg-gray-100 text-gray-600',
  basic: 'bg-blue-100 text-blue-700',
  professional: 'bg-violet-100 text-violet-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

function UsageMeter({ label, dim }: { label: string; dim: BillingDimension }) {
  const isUnlimited = dim.limit === null;
  const pct = isUnlimited ? 100 : Math.min(100, Math.round((dim.used / dim.limit!) * 100));
  const barColor =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-blue-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-400 tabular-nums">
          {isUnlimited ? `${dim.used.toLocaleString()} / ∞` : `${dim.used.toLocaleString()} / ${dim.limit!.toLocaleString()}`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${isUnlimited ? 20 : pct}%` }}
        />
      </div>
    </div>
  );
}

const FEATURE_LABELS: Record<string, { label: string; desc: string }> = {
  feature_property_search:       { label: "Property Search",       desc: "AI-powered natural language property search via WhatsApp" },
  feature_property_listing:      { label: "Property Listing",      desc: "Allow clients to list properties via WhatsApp conversation" },
  feature_tax_advice:            { label: "Tax Advisory",          desc: "AI tax guidance for buyers and sellers" },
  feature_loan_eligibility:      { label: "Loan Eligibility",      desc: "Mortgage, EMI, and financing eligibility checks" },
  feature_scam_check:            { label: "Scam Check",            desc: "AI fraud and scam risk scoring for listings" },
  feature_document_verification: { label: "Document Verification", desc: "OCR-based document tampering and ownership verification" },
  feature_talk_to_agent:         { label: "Talk to Agent",         desc: "AI routing to connect clients with agents" },
  feature_deal_lock:             { label: "Deal Lock",             desc: "Token payment and inventory reservation system" },
  feature_property_audit:        { label: "Property Audit",        desc: "AI-generated audit reports with investment scores" },
};

const SENTINEL = "__configured__";

function SensitiveInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-14 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default function OrgSettingsPage() {
  const qc = useQueryClient();
  const [showPricing, setShowPricing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["org-config"],
    queryFn: () => getOrgConfig(),
  });

  const { data: billingData } = useQuery<BillingUsage>({
    queryKey: ["billing-usage"],
    queryFn: () => getBillingUsage().then((r) => r.data),
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, boolean>) => updateOrgConfig(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-config"] }),
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => resetOrgConfigKey(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-config"] }),
  });

  const portalMutation = useMutation({
    mutationFn: getBillingPortal,
    onSuccess: (data) => { window.location.href = data.url; },
  });

  const { data: paymentSettings } = useQuery<OrgPaymentSettings>({
    queryKey: ["org-payment-settings"],
    queryFn: () => getOrgPaymentSettings().then((r) => r.data),
  });
  const [psGateway, setPsGateway] = useState<string>("manual");
  const [psVals, setPsVals] = useState<Record<string, string>>({});
  const [psSaved, setPsSaved] = useState(false);

  // Sync payment settings from server
  useEffect(() => {
    if (!paymentSettings) return;
    setPsGateway(paymentSettings.gateway ?? "manual");
    setPsVals({
      safepay_merchant_key:  paymentSettings.safepay_merchant_key === SENTINEL ? "" : (paymentSettings.safepay_merchant_key ?? ""),
      safepay_secret_key:    paymentSettings.safepay_secret_key === SENTINEL ? "" : (paymentSettings.safepay_secret_key ?? ""),
      safepay_environment:   paymentSettings.safepay_environment ?? "sandbox",
      bsecure_client_id:     paymentSettings.bsecure_client_id === SENTINEL ? "" : (paymentSettings.bsecure_client_id ?? ""),
      bsecure_client_secret: paymentSettings.bsecure_client_secret === SENTINEL ? "" : (paymentSettings.bsecure_client_secret ?? ""),
      bsecure_environment:   paymentSettings.bsecure_environment ?? "sandbox",
      jazzcash_number:       paymentSettings.jazzcash_number ?? "",
      easypaisa_number:      paymentSettings.easypaisa_number ?? "",
      bank_account_number:   paymentSettings.bank_account_number ?? "",
      bank_account_name:     paymentSettings.bank_account_name ?? "",
    });
  }, [paymentSettings]);

  const paymentSettingsMutation = useMutation({
    mutationFn: (data: Record<string, string>) => updateOrgPaymentSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-payment-settings"] });
      setPsSaved(true);
      setTimeout(() => setPsSaved(false), 2500);
    },
  });

  const features: Record<string, string> = data?.features ?? {};
  const overrides: string[] = data?.overrides ?? [];

  function toggle(key: string, current: boolean) {
    updateMutation.mutate({ [key]: !current });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Organization profile preferences and AI feature flags
        </p>
      </div>

      {/* Plan & usage */}
      {billingData && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Plan &amp; Usage</h2>
              <p className="text-xs text-gray-400 mt-0.5">Current billing period consumption</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${PLAN_COLORS[billingData.plan] ?? PLAN_COLORS.trial}`}>
                {PLAN_LABELS[billingData.plan] ?? billingData.plan}
              </span>
              {billingData.plan !== 'enterprise' && (
                <button
                  onClick={() => setShowPricing(true)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Upgrade
                </button>
              )}
              {billingData.plan !== 'trial' && (
                <button
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {portalMutation.isPending ? "Opening…" : "Manage Subscription"}
                </button>
              )}
              <a
                href="/organization/billing/invoices"
                className="text-xs font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                Invoices
              </a>
            </div>
          </div>
          <div className="px-6 py-5 space-y-5">
            <UsageMeter label="Agents" dim={billingData.usage.agents} />
            <UsageMeter label="Inventory listings" dim={billingData.usage.inventory} />
            <UsageMeter
              label={`WhatsApp AI turns — ${billingData.usage.wa_tokens.period}`}
              dim={billingData.usage.wa_tokens}
            />
            {billingData.plan === 'trial' && (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                <p className="text-xs text-amber-700">
                  You are on the <strong>Trial plan</strong>. Upgrade to unlock higher limits and advanced features.
                </p>
                <button
                  onClick={() => setShowPricing(true)}
                  className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                >
                  View plans
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature flags */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-800">AI Feature Flags</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Override platform defaults for your organization. Greyed-out keys use the platform default.
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {Object.entries(FEATURE_LABELS).map(([key, { label, desc }]) => {
            const isEnabled  = features[key] === "true";
            const isOverride = overrides.includes(key);

            return (
              <div key={key} className="flex items-center justify-between px-6 py-4">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {isOverride && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                        Override
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOverride && (
                    <button
                      onClick={() => resetMutation.mutate(key)}
                      disabled={resetMutation.isPending}
                      className="text-xs text-gray-400 hover:text-gray-600 hover:underline transition-colors"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => toggle(key, isEnabled)}
                    disabled={updateMutation.isPending}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      isEnabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
                        isEnabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal-lock payment gateway */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-800">Deal-Lock Payment Gateway</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure how clients pay the token deposit when locking a deal. Overrides the platform default.
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Gateway selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "safepay", label: "Safepay",  desc: "Online (Safepay checkout)" },
              { value: "bsecure", label: "bSecure",  desc: "Online (bSecure checkout)" },
              { value: "manual",  label: "Manual",   desc: "JazzCash / bank transfer" },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPsGateway(value)}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  psGateway === value ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${psGateway === value ? "border-blue-500 bg-blue-500" : "border-gray-300"}`} />
                  <span className="text-sm font-semibold text-gray-900">{label}</span>
                </div>
                <p className="text-xs text-gray-500 ml-5">{desc}</p>
              </button>
            ))}
          </div>

          {/* Safepay credentials */}
          {psGateway === "safepay" && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Safepay Credentials</p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Merchant Key</label>
                <SensitiveInput value={psVals.safepay_merchant_key ?? ""} onChange={(v) => setPsVals((p) => ({ ...p, safepay_merchant_key: v }))} placeholder="sk_live_…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Secret Key</label>
                <SensitiveInput value={psVals.safepay_secret_key ?? ""} onChange={(v) => setPsVals((p) => ({ ...p, safepay_secret_key: v }))} placeholder="sk_…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={psVals.safepay_environment ?? "sandbox"}
                  onChange={(e) => setPsVals((p) => ({ ...p, safepay_environment: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="sandbox">Sandbox (testing)</option>
                  <option value="production">Production (live)</option>
                </select>
              </div>
            </div>
          )}

          {/* bSecure credentials */}
          {psGateway === "bsecure" && (
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">bSecure Credentials</p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client ID</label>
                <SensitiveInput value={psVals.bsecure_client_id ?? ""} onChange={(v) => setPsVals((p) => ({ ...p, bsecure_client_id: v }))} placeholder="bs_…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Secret</label>
                <SensitiveInput value={psVals.bsecure_client_secret ?? ""} onChange={(v) => setPsVals((p) => ({ ...p, bsecure_client_secret: v }))} placeholder="bs_secret_…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={psVals.bsecure_environment ?? "sandbox"}
                  onChange={(e) => setPsVals((p) => ({ ...p, bsecure_environment: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="sandbox">Sandbox (testing)</option>
                  <option value="production">Production (live)</option>
                </select>
              </div>
            </div>
          )}

          {/* Manual payment details */}
          {psGateway === "manual" && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Manual Payment Details</p>
              {[
                { key: "jazzcash_number",    label: "JazzCash Number",    placeholder: "03xx-xxxxxxx" },
                { key: "easypaisa_number",   label: "Easypaisa Number",   placeholder: "03xx-xxxxxxx" },
                { key: "bank_account_number", label: "Bank Account No.",  placeholder: "PK00XXXX0000000000000000" },
                { key: "bank_account_name",   label: "Account Name",      placeholder: "Company Ltd." },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={psVals[key] ?? ""}
                    onChange={(e) => setPsVals((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {psSaved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          <button
            onClick={() => paymentSettingsMutation.mutate({ gateway: psGateway, ...psVals })}
            disabled={paymentSettingsMutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {paymentSettingsMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Notification preferences */}
      <NotificationPreferencesPanel />

      {showPricing && billingData && (
        <PricingModal
          currentPlan={billingData.plan}
          onClose={() => setShowPricing(false)}
        />
      )}
    </div>
  );
}
