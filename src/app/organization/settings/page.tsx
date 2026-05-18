"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrgConfig, updateOrgConfig, resetOrgConfigKey } from "@/lib/api";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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

export default function OrgSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["org-config"],
    queryFn: () => getOrgConfig(),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, boolean>) => updateOrgConfig(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-config"] }),
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => resetOrgConfigKey(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-config"] }),
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

      {/* Notification preferences */}
      <NotificationPreferencesPanel />
    </div>
  );
}
