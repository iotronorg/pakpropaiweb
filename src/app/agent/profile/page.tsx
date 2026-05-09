"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentProfile, updateAgentProfile } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { AgentProfile } from "@/types";

const SPECIALIZATION_OPTIONS = [
  { value: "residential_buy",  label: "Residential — Buy/Sell" },
  { value: "residential_rent", label: "Residential — Rent/Lease" },
  { value: "commercial",       label: "Commercial" },
  { value: "plots",            label: "Plots & Land" },
  { value: "new_projects",     label: "New Projects / Off-plan" },
  { value: "luxury",           label: "Luxury / High-end" },
  { value: "industrial",       label: "Industrial / Warehouse" },
];

type ProfileForm = {
  name: string;
  email: string;
  company_name: string;
  designation: string;
  bio: string;
  primary_city: string;
  cities: string;
  areas: string;
  specializations: string[];
  years_experience: string;
};

function profileToForm(p: AgentProfile): ProfileForm {
  return {
    name:             p.name ?? "",
    email:            p.email ?? "",
    company_name:     p.company_name ?? "",
    designation:      p.designation ?? "",
    bio:              p.bio ?? "",
    primary_city:     p.primary_city ?? "",
    cities:           (p.cities ?? []).join(", "),
    areas:            (p.areas  ?? []).join(", "),
    specializations:  p.specializations ?? [],
    years_experience: p.years_experience ? String(p.years_experience) : "",
  };
}

function formToPayload(f: ProfileForm): Record<string, unknown> {
  return {
    name:             f.name,
    email:            f.email            || undefined,
    company_name:     f.company_name     || undefined,
    designation:      f.designation      || undefined,
    bio:              f.bio              || undefined,
    primary_city:     f.primary_city     || undefined,
    cities:  f.cities ? f.cities.split(",").map((s) => s.trim()).filter(Boolean) : [],
    areas:   f.areas  ? f.areas.split(",").map((s)  => s.trim()).filter(Boolean) : [],
    specializations:  f.specializations,
    years_experience: f.years_experience ? Number(f.years_experience) : undefined,
  };
}

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

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
  const [form, setForm] = useState<ProfileForm>({
    name: "", email: "", company_name: "", designation: "",
    bio: "", primary_city: "", cities: "", areas: "",
    specializations: [], years_experience: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: () => getAgentProfile().then((r) => r.data as AgentProfile),
  });

  const updateMutation = useMutation({
    mutationFn: (f: ProfileForm) => updateAgentProfile(formToPayload(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-profile"] });
      setEditing(false);
    },
  });

  function startEdit() {
    if (!data) return;
    setForm(profileToForm(data));
    setEditing(true);
  }

  function toggleSpec(value: string) {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(value)
        ? f.specializations.filter((s) => s !== value)
        : [...f.specializations, value],
    }));
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
    <div className="space-y-6 max-w-4xl">
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
          { label: "Total Leads",   value: p.total_leads },
          { label: "Total Listings",value: p.total_listings },
          { label: "Closed Deals",  value: p.closed_deals },
          { label: "Rating",        value: p.rating !== null ? `${p.rating}/5` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Edit Profile</h2>

          {/* Basic info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Basic Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input className={inputCls} value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" className={inputCls} value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                <input className={inputCls} value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
                <input className={inputCls} value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Years of Experience</label>
                <input type="number" min="0" className={inputCls} value={form.years_experience}
                  onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
          </div>

          {/* Coverage */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Geographic Coverage</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Primary City</label>
                <input className={inputCls} value={form.primary_city}
                  onChange={(e) => setForm((f) => ({ ...f, primary_city: e.target.value }))}
                  placeholder="e.g. Lahore" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">All Cities (comma-separated)</label>
                <input className={inputCls} value={form.cities}
                  onChange={(e) => setForm((f) => ({ ...f, cities: e.target.value }))}
                  placeholder="Lahore, Islamabad, Rawalpindi" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Areas / Societies (comma-separated)</label>
                <input className={inputCls} value={form.areas}
                  onChange={(e) => setForm((f) => ({ ...f, areas: e.target.value }))}
                  placeholder="DHA Phase 5, Bahria Town, F-7" />
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Specializations</p>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATION_OPTIONS.map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 accent-blue-600"
                    checked={form.specializations.includes(s.value)}
                    onChange={() => toggleSpec(s.value)}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
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
            <Field label="Experience" value={p.years_experience ? `${p.years_experience} yrs` : null} />
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
              <TagList items={p.cities ?? []} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Areas</p>
              <TagList items={p.areas ?? []} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Specializations</p>
              <TagList items={(p.specializations ?? []).map(
                (s) => SPECIALIZATION_OPTIONS.find((o) => o.value === s)?.label ?? s
              )} />
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
