"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentProfile, updateAgentProfile } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { AgentProfile } from "@/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-gray-300 text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
          {t}
        </span>
      ))}
    </div>
  );
}

export default function AgentProfilePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<AgentProfile>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: () => getAgentProfile().then((r) => r.data as AgentProfile),
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<AgentProfile>) => updateAgentProfile(updates as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-profile"] });
      setEditing(false);
      setForm({});
    },
  });

  function startEdit() {
    if (!data) return;
    setForm({
      name: data.name,
      email: data.email,
      company_name: data.company_name,
      designation: data.designation,
      bio: data.bio,
      primary_city: data.primary_city,
    });
    setEditing(true);
  }

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (error || !data) return (
    <div className="p-6 text-center text-gray-400">
      <p className="text-4xl mb-3">👤</p>
      <p className="font-medium">Could not load profile</p>
      <p className="text-xs mt-1">Make sure this account is linked to an agent profile</p>
    </div>
  );

  const p = data;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {p.designation || p.agent_type} {p.company_name ? `· ${p.company_name}` : ""}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {p.is_verified && <Badge label="Verified" variant="green" />}
            {p.is_featured && <Badge label="Featured" variant="blue" />}
            {!p.is_active && <Badge label="Inactive" variant="gray" />}
          </div>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: p.total_leads },
          { label: "Total Listings", value: p.total_listings },
          { label: "Closed Deals", value: p.closed_deals },
          { label: "Rating", value: p.rating !== null ? `${p.rating}/5` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold mb-2">Edit Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                { key: "name", label: "Full Name" },
                { key: "email", label: "Email" },
                { key: "company_name", label: "Company Name" },
                { key: "designation", label: "Designation" },
                { key: "primary_city", label: "Primary City" },
              ] as { key: keyof AgentProfile; label: string }[]
            ).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={(form[key] as string) ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm h-24 resize-none"
              value={(form.bio as string) ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => { setEditing(false); setForm({}); }}
              className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          {updateMutation.isError && (
            <p className="text-xs text-red-600">Failed to save — please try again.</p>
          )}
        </div>
      ) : (
        /* Read-only profile */
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Phone" value={p.phone} />
            <Field label="WhatsApp" value={p.whatsapp_number || p.phone} />
            <Field label="Email" value={p.email} />
            <Field label="Primary City" value={p.primary_city} />
            <Field label="Company" value={p.company_name} />
            <Field label="Designation" value={p.designation} />
            <Field label="Agent Type" value={p.agent_type} />
            <Field label="Member Since" value={formatDate(p.joined_at)} />
          </div>

          {p.bio && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Bio</p>
              <p className="text-sm text-gray-700 leading-relaxed">{p.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Cities</p>
              <TagList items={p.cities} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Areas</p>
              <TagList items={p.areas} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Specializations</p>
              <TagList items={p.specializations} />
            </div>
          </div>

          {p.parent_organization_name && (
            <Field label="Parent Organization" value={p.parent_organization_name} />
          )}
        </div>
      )}
    </div>
  );
}
