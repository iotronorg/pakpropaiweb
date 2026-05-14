"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAgent, getAgentsList } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { AgentProfile } from "@/types";

const AGENT_TYPES = [
  { value: "individual", label: "Independent / Freelance Agent" },
  { value: "agency",     label: "Agency Sales Agent" },
  { value: "developer",  label: "Developer Sales Agent" },
];

const SPEC_OPTIONS = [
  { value: "residential_buy",  label: "Residential — Buy/Sell" },
  { value: "residential_rent", label: "Residential — Rent/Lease" },
  { value: "commercial",       label: "Commercial Properties" },
  { value: "plots",            label: "Plots & Land" },
  { value: "new_projects",     label: "New Projects / Off-plan" },
  { value: "luxury",           label: "Luxury / High-end" },
  { value: "industrial",       label: "Industrial / Warehouse" },
];

const BLANK = {
  phone:              "",
  name:               "",
  agent_type:         "individual",
  email:              "",
  whatsapp_number:    "",
  company_name:       "",
  designation:        "",
  license_number:     "",
  years_experience:   "",
  bio:                "",
  primary_city:       "",
  cities:             "",
  areas:              "",
  specializations:    [] as string[],
  parent_organization: "" as string,
};

type FormState = typeof BLANK;

export default function AgentRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isDeveloperEmployee =
    form.agent_type === "developer" || form.agent_type === "agency";

  const { data: orgsData } = useQuery({
    queryKey: ["orgs-list"],
    queryFn: () =>
      getAgentsList({ agent_type: "developer" }).then((r) => {
        const devs = (r.data?.results ?? r.data ?? []) as AgentProfile[];
        return getAgentsList({ agent_type: "agency" }).then((r2) => {
          const agcs = (r2.data?.results ?? r2.data ?? []) as AgentProfile[];
          return [...devs, ...agcs];
        });
      }),
    enabled: isDeveloperEmployee,
  });

  const orgs: AgentProfile[] = orgsData ?? [];

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function toggleSpec(value: string) {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(value)
        ? f.specializations.filter((s) => s !== value)
        : [...f.specializations, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      phone:            form.phone.trim(),
      name:             form.name.trim(),
      agent_type:       form.agent_type,
      email:            form.email.trim(),
      whatsapp_number:  form.whatsapp_number.trim(),
      company_name:     form.company_name.trim(),
      designation:      form.designation.trim(),
      license_number:   form.license_number.trim(),
      years_experience: form.years_experience ? parseInt(form.years_experience) : 0,
      bio:              form.bio.trim(),
      primary_city:     form.primary_city.trim(),
      cities:           form.cities ? form.cities.split(",").map((c) => c.trim()).filter(Boolean) : [],
      areas:            form.areas ? form.areas.split(",").map((a) => a.trim()).filter(Boolean) : [],
      specializations:  form.specializations,
    };

    if (isDeveloperEmployee && form.parent_organization) {
      payload.parent_organization = parseInt(form.parent_organization);
    }

    try {
      await registerAgent(payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data && typeof data === "object") {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          mapped[k] = Array.isArray(v) ? v.join(" ") : String(v);
        }
        setErrors(mapped);
      } else {
        setErrors({ detail: "Registration failed. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your registration is under review. You will receive a WhatsApp notification once your
            application is approved.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Agent Registration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Register as an agent on PakProp AI. Your application will be reviewed before activation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Account ─────────────────────────── */}
          <Section title="Account Details">
            <Field label="Full Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Muhammad Ali"
                className={input(errors.name)}
                required
              />
            </Field>
            <Field label="Phone Number" required error={errors.phone} hint="+92XXXXXXXXXX">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+923001234567"
                className={input(errors.phone)}
                required
              />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="agent@example.com"
                className={input(errors.email)}
              />
            </Field>
            <Field label="WhatsApp Number" error={errors.whatsapp_number} hint="Leave blank if same as phone">
              <input
                type="tel"
                value={form.whatsapp_number}
                onChange={(e) => set("whatsapp_number", e.target.value)}
                placeholder="+923001234567"
                className={input(errors.whatsapp_number)}
              />
            </Field>
          </Section>

          {/* ── Section 2: Agent Type ──────────────────────── */}
          <Section title="Agent Type">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AGENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    set("agent_type", t.value);
                    set("parent_organization", "");
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${
                    form.agent_type === t.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.agent_type === t.value ? "text-blue-700" : "text-gray-800"}`}>
                    {t.label}
                  </p>
                </button>
              ))}
            </div>

            {isDeveloperEmployee && (
              <Field
                label="Developer / Agency"
                required
                error={errors.parent_organization}
                hint="Select the organization you work for. Leave blank if applying independently."
              >
                <select
                  value={form.parent_organization}
                  onChange={(e) => set("parent_organization", e.target.value)}
                  className={input(errors.parent_organization)}
                >
                  <option value="">— Select organization —</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} {o.company_name ? `— ${o.company_name}` : ""} ({o.primary_city || "N/A"})
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </Section>

          {/* ── Section 3: Professional ────────────────────── */}
          <Section title="Professional Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company / Agency Name" error={errors.company_name}>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  placeholder="Ali Real Estate"
                  className={input(errors.company_name)}
                />
              </Field>
              <Field label="Designation" error={errors.designation}>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                  placeholder="Property Consultant"
                  className={input(errors.designation)}
                />
              </Field>
              <Field label="License Number" error={errors.license_number} hint="REAP / PBTE / local authority">
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => set("license_number", e.target.value)}
                  placeholder="REAP-2024-XXXX"
                  className={input(errors.license_number)}
                />
              </Field>
              <Field label="Years of Experience" error={errors.years_experience}>
                <input
                  type="number"
                  min={0}
                  value={form.years_experience}
                  onChange={(e) => set("years_experience", e.target.value)}
                  placeholder="5"
                  className={input(errors.years_experience)}
                />
              </Field>
            </div>
            <Field label="Bio" error={errors.bio} hint="2–4 sentences about your experience">
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Experienced property consultant specializing in DHA Lahore residential and commercial plots..."
                className={input(errors.bio)}
              />
            </Field>
          </Section>

          {/* ── Section 4: Coverage ───────────────────────── */}
          <Section title="Geographic Coverage">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Primary City" error={errors.primary_city}>
                <input
                  type="text"
                  value={form.primary_city}
                  onChange={(e) => set("primary_city", e.target.value)}
                  placeholder="Lahore"
                  className={input(errors.primary_city)}
                />
              </Field>
              <Field label="All Cities" error={errors.cities} hint="Comma-separated">
                <input
                  type="text"
                  value={form.cities}
                  onChange={(e) => set("cities", e.target.value)}
                  placeholder="Lahore, Islamabad, Rawalpindi"
                  className={input(errors.cities)}
                />
              </Field>
            </div>
            <Field label="Areas / Societies" error={errors.areas} hint="Comma-separated">
              <input
                type="text"
                value={form.areas}
                onChange={(e) => set("areas", e.target.value)}
                placeholder="DHA Phase 5, Gulberg III, Bahria Town"
                className={input(errors.areas)}
              />
            </Field>
          </Section>

          {/* ── Section 5: Specializations ────────────────── */}
          <Section title="Specializations">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPEC_OPTIONS.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    form.specializations.includes(s.value)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.specializations.includes(s.value)}
                    onChange={() => toggleSpec(s.value)}
                    className="accent-blue-600"
                  />
                  <span className="text-xs font-medium text-gray-700">{s.label}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Global error ──────────────────────────────── */}
          {errors.detail && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {errors.detail}
            </p>
          )}

          {/* ── Actions ───────────────────────────────────── */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function input(err?: string) {
  return `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    err ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
  }`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, required, hint, error, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
