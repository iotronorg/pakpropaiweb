"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentProfile, updateAgentProfile, getOrgConfig, updateOrgConfig } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const FEATURE_META: Record<string, { label: string; description: string }> = {
  feature_property_search:        { label: "Property Search",        description: "AI-powered natural language property search via WhatsApp" },
  feature_property_listing:       { label: "Property Listing",       description: "Clients can create listings conversationally via WhatsApp" },
  feature_tax_advice:             { label: "Tax Advice",             description: "AI property tax and capital gains guidance" },
  feature_loan_eligibility:       { label: "Loan Eligibility",       description: "Mortgage and EMI calculator for clients" },
  feature_scam_check:             { label: "Scam Check",             description: "AI fraud detection for listings and agents" },
  feature_document_verification:  { label: "Document Verification",  description: "OCR-based ownership document analysis" },
  feature_property_audit:         { label: "Property Audit",         description: "Full AI-generated audit report with investment score" },
  feature_talk_to_agent:          { label: "Talk to Agent",          description: "AI routes clients to available agents" },
  feature_deal_lock:              { label: "Deal Lock",              description: "48-hour token payment and deal reservation system" },
  feature_voice_messages:         { label: "Voice Messages",         description: "Transcribe and respond to WhatsApp voice notes" },
};

interface OrgProfile {
  company_name?: string;
  office_address?: string;
  website?: string;
  ntn_number?: string;
}

function OrgProfilePanel() {
  const [companyName, setCompanyName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [ntnNumber, setNtnNumber] = useState("");
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-profile-dev"],
    queryFn: () => getAgentProfile().then((r) => r.data as OrgProfile),
  });

  useEffect(() => {
    if (data) {
      setCompanyName(data.company_name ?? "");
      setOfficeAddress(data.office_address ?? "");
      setWebsite(data.website ?? "");
      setNtnNumber(data.ntn_number ?? "");
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAgentProfile({
        ...(companyName ? { company_name: companyName } : {}),
        ...(officeAddress ? { office_address: officeAddress } : {}),
        ...(website ? { website } : {}),
        ...(ntnNumber ? { ntn_number: ntnNumber } : {}),
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-800">Organization Profile</h2>
        <p className="text-xs text-gray-500 mt-0.5">Company details shown to buyers and agents</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
          <input
            className={inputCls}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. ABC Real Estate"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">NTN Number</label>
          <input
            className={inputCls}
            value={ntnNumber}
            onChange={(e) => setNtnNumber(e.target.value)}
            placeholder="e.g. 1234567-8"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Office Address</label>
          <input
            className={inputCls}
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
            placeholder="e.g. Office 5, DHA Phase 6, Lahore"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
          <input
            className={inputCls}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="e.g. https://abcrealestate.com"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving…" : "Save Profile"}
        </button>
        {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  );
}

interface OrgConfigData {
  features: Record<string, boolean>;
  overrides: string[];
  allowed_keys: string[];
}

function FeatureFlagsPanel() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery<OrgConfigData>({
    queryKey: ["org-config"],
    queryFn: getOrgConfig,
  });

  const mutation = useMutation({
    mutationFn: (changes: Record<string, boolean>) => updateOrgConfig(changes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-config"] });
      setPending({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const features = { ...(data?.features ?? {}), ...pending };
  const overrides = new Set(data?.overrides ?? []);
  const dirty = Object.keys(pending).length > 0;

  function toggle(key: string) {
    setPending((prev) => ({ ...prev, [key]: !features[key] }));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-800">AI Feature Flags</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Enable or disable features for your organization. Platform defaults apply where not overridden.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {(data?.allowed_keys ?? []).map((key) => {
          const meta = FEATURE_META[key] ?? { label: key, description: "" };
          const enabled = features[key] ?? false;
          const isOverride = overrides.has(key) || key in pending;

          return (
            <div key={key} className="flex items-center justify-between py-3 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{meta.label}</p>
                  {isOverride && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                      custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{meta.description}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => mutation.mutate(pending)}
          disabled={!dirty || mutation.isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save Feature Flags"}
        </button>
        {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
        {dirty && !mutation.isPending && (
          <span className="text-xs text-amber-600">{Object.keys(pending).length} unsaved change{Object.keys(pending).length !== 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  );
}

export default function DeveloperSettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your organization profile and preferences</p>
      </div>
      <OrgProfilePanel />
      <FeatureFlagsPanel />
      <NotificationPreferencesPanel />
    </div>
  );
}
