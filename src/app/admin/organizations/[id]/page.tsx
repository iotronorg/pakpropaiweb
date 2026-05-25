"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminOrg, updateOrg, suspendOrg, activateOrg, getAdminOrgConfig, updateAdminOrgConfig, resetAdminOrgConfigKey } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatsCard } from "@/components/ui/StatsCard";
import { formatDate } from "@/lib/utils";
import { Users, TrendingUp, Building2 } from "lucide-react";
import type { AdminOrganizationDetail } from "@/types";

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const FEATURE_LABELS: Record<string, { label: string; desc: string }> = {
  feature_property_search:       { label: "Property Search",       desc: "AI-powered natural language property search" },
  feature_property_listing:      { label: "Property Listing",      desc: "Allow clients to list properties via WhatsApp" },
  feature_tax_advice:            { label: "Tax Advisory",          desc: "AI tax guidance for buyers and sellers" },
  feature_loan_eligibility:      { label: "Loan Eligibility",      desc: "Mortgage and financing eligibility checks" },
  feature_scam_check:            { label: "Scam Check",            desc: "AI fraud and scam risk scoring for listings" },
  feature_document_verification: { label: "Document Verification", desc: "OCR-based document verification" },
  feature_property_audit:        { label: "Property Audit",        desc: "AI-generated audit reports with investment scores" },
  feature_talk_to_agent:         { label: "Talk to Agent",         desc: "AI routing to connect clients with agents" },
  feature_deal_lock:             { label: "Deal Lock",             desc: "Token payment and inventory reservation" },
  feature_voice_messages:        { label: "Voice Messages",        desc: "Transcribe and process WhatsApp voice notes" },
  feature_follow_up_automation:  { label: "Follow-up Automation",  desc: "AI-driven automated follow-up messages for leads" },
  feature_auto_assign:           { label: "Auto Assign",           desc: "Automatically assign new leads to available agents" },
};

// ── Edit modal ─────────────────────────────────────────────────────────────────

function EditModal({ org, onClose }: { org: AdminOrganizationDetail; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name:        org.name,
    email:       org.email       ?? "",
    phone:       org.phone       ?? "",
    website:     org.website     ?? "",
    city:        org.city        ?? "",
    address:     org.address     ?? "",
    is_verified: org.is_verified,
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => updateOrg(org.id, {
      name:        form.name,
      email:       form.email   || null,
      phone:       form.phone   || null,
      website:     form.website || null,
      city:        form.city    || null,
      address:     form.address || null,
      is_verified: form.is_verified,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-org", org.id] });
      onClose();
    },
    onError: (e: unknown) => {
      const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const first = d ? Object.values(d)[0] : null;
      setError(Array.isArray(first) ? String(first[0]) : "Failed to save changes.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Edit Organization</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
            <input className={inputCls} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_verified"
              checked={form.is_verified}
              onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_verified" className="text-sm text-gray-700">Verified organization</label>
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!form.name || mutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Info row ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-32 shrink-0 text-gray-400">{label}</span>
      <span className="text-gray-800 break-all">{value || <span className="text-gray-300">—</span>}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminOrgDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const { data: org, isLoading, isError } = useQuery({
    queryKey: ["admin-org", params.id],
    queryFn: () => getAdminOrg(params.id).then((r) => r.data as AdminOrganizationDetail),
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendOrg(params.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-org", params.id] }),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateOrg(params.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-org", params.id] }),
  });

  const { data: configData } = useQuery({
    queryKey: ["admin-org-config", params.id],
    queryFn: () => getAdminOrgConfig(params.id),
    enabled: !!org,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: boolean }) =>
      updateAdminOrgConfig(params.id, { [key]: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-org-config", params.id] }),
  });

  const resetFlagMutation = useMutation({
    mutationFn: (key: string) => resetAdminOrgConfigKey(params.id, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-org-config", params.id] }),
  });

  const features: Record<string, boolean> = configData?.features ?? {};
  const overrides: string[] = configData?.overrides ?? [];

  if (isLoading) return <div className="flex justify-center py-32"><LoadingSpinner /></div>;
  if (isError || !org) return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
      Failed to load organization. Please refresh the page.
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/organizations" className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            ← Back to Organizations
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm font-bold text-blue-700">{org.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
                <Badge
                  label={org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                  variant={org.plan === "enterprise" ? "blue" : org.plan === "professional" ? "green" : "gray"}
                />
                <Badge label={org.is_active ? "Active" : "Suspended"} variant={org.is_active ? "green" : "red"} />
                {org.is_verified && <Badge label="Verified" variant="green" />}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{org.country} · Created {formatDate(org.created_at)}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          {org.is_active ? (
            <button
              onClick={() => suspendMutation.mutate()}
              disabled={suspendMutation.isPending}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {suspendMutation.isPending ? "Suspending…" : "Suspend"}
            </button>
          ) : (
            <button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {activateMutation.isPending ? "Activating…" : "Activate"}
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Active Agents"     value={org.agent_count}    color="blue"   icon={Users}      index={0} />
        <StatsCard label="Total Leads"       value={org.lead_count}     color="purple" icon={TrendingUp}  index={1} />
        <StatsCard label="Active Properties" value={org.property_count} color="teal"   icon={Building2}   index={2} />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
          <InfoRow label="Email"   value={org.email} />
          <InfoRow label="Phone"   value={org.phone} />
          <InfoRow label="Website" value={org.website} />
          <InfoRow label="Admin"   value={org.admin_phone} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Location</h3>
          <InfoRow label="Country" value={org.country} />
          <InfoRow label="City"    value={org.city} />
          <InfoRow label="Address" value={org.address} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Settings</h3>
          <InfoRow label="Language"    value={org.language} />
          <InfoRow label="Measurement" value={org.measurement_system} />
          <InfoRow label="Type"        value={org.org_type.replace(/_/g, ' ')} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Account</h3>
          <InfoRow label="ID"      value={org.id} />
          <InfoRow label="Slug"    value={org.slug} />
          <InfoRow label="Updated" value={formatDate(org.updated_at)} />
        </div>
      </div>

      {/* Feature Flags */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700">Feature Flags</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Override platform defaults for this organization. Amber badge = org-level override active.
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {Object.entries(FEATURE_LABELS).map(([key, { label, desc }]) => {
            const isEnabled  = features[key] === true;
            const isOverride = overrides.includes(key);
            return (
              <div key={key} className="flex items-center justify-between px-6 py-3">
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
                      onClick={() => resetFlagMutation.mutate(key)}
                      disabled={resetFlagMutation.isPending}
                      className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => toggleMutation.mutate({ key, value: !isEnabled })}
                    disabled={toggleMutation.isPending}
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

      {showEdit && <EditModal org={org} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
