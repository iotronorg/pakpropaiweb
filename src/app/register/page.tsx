"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAgent, getAgentsList, verifyRegistrationOtp, sendOtp } from "@/lib/api";
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
  password:           "",
  confirmPassword:    "",
};

type FormState = typeof BLANK;

type PasswordStrength = "too_short" | "weak" | "fair" | "strong";

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "too_short";
  const types = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  if (types === 1) return "weak";
  if (types === 2) return "fair";
  return "strong";
}

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  too_short: { label: "Too short", color: "bg-red-500",   width: "w-1/4" },
  weak:      { label: "Weak",      color: "bg-red-500",   width: "w-1/4" },
  fair:      { label: "Fair",      color: "bg-amber-400", width: "w-2/4" },
  strong:    { label: "Strong",    color: "bg-green-500", width: "w-full" },
};

const STRENGTH_TEXT_COLOR: Record<PasswordStrength, string> = {
  too_short: "text-red-500",
  weak:      "text-red-500",
  fair:      "text-amber-500",
  strong:    "text-green-600",
};

export default function AgentRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const isDeveloperEmployee =
    form.agent_type === "developer" || form.agent_type === "agency";

  const passwordStrength = form.password ? getPasswordStrength(form.password) : null;

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

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

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
      password:         form.password,
    };

    if (isDeveloperEmployee && form.parent_organization) {
      payload.parent_organization = parseInt(form.parent_organization);
    }

    try {
      const res = await registerAgent(payload);
      const data = res.data as Record<string, unknown>;
      if (data?.otp_required) {
        setOtpPhone(form.phone.trim());
        setOtpStep(true);
      } else {
        router.push("/login?registered=true");
      }
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

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError("");
    setOtpSubmitting(true);
    try {
      await verifyRegistrationOtp(otpPhone, otpCode);
      router.push("/login?registered=true");
    } catch {
      setOtpError("Invalid or expired code. Please try again.");
    } finally {
      setOtpSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setResending(true);
    setOtpError("");
    try {
      await sendOtp(otpPhone, "registration_verify");
    } catch {
      setOtpError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  // ── OTP step UI ──────────────────────────────────────────────────────────────
  if (otpStep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verify your phone number</h2>
            <p className="mt-2 text-sm text-gray-500">
              We sent a 6-digit code to your WhatsApp at{" "}
              <span className="font-medium text-gray-700">{otpPhone}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Verification Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setOtpError("");
                }}
                placeholder="123456"
                className={`w-full rounded-lg border px-4 py-3 text-lg tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  otpError ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
                }`}
                required
                autoFocus
              />
              {otpError && <p className="mt-1 text-xs text-red-500">{otpError}</p>}
            </div>

            <button
              type="submit"
              disabled={otpSubmitting || otpCode.length < 6}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {otpSubmitting ? "Verifying..." : "Verify & Activate"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          </div>
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
            Register as an agent on RealTron AI. Your application will be reviewed before activation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Account */}
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

            {/* Password */}
            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Create a password"
                  className={input(errors.password) + " pr-10"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && passwordStrength && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${STRENGTH_CONFIG[passwordStrength].color} ${STRENGTH_CONFIG[passwordStrength].width}`}
                    />
                  </div>
                  <p className={`mt-1 text-xs font-medium ${STRENGTH_TEXT_COLOR[passwordStrength]}`}>
                    {STRENGTH_CONFIG[passwordStrength].label}
                  </p>
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  className={input(errors.confirmPassword) + " pr-10"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>
          </Section>

          {/* Section 2: Agent Type */}
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
                  <option value="">Select organization</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} {o.company_name ? `— ${o.company_name}` : ""} ({o.primary_city || "N/A"})
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </Section>

          {/* Section 3: Professional */}
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
            <Field label="Bio" error={errors.bio} hint="2-4 sentences about your experience">
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Experienced property consultant specializing in DHA Lahore residential and commercial plots..."
                className={input(errors.bio)}
              />
            </Field>
          </Section>

          {/* Section 4: Coverage */}
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

          {/* Section 5: Specializations */}
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

          {/* Global error */}
          {errors.detail && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {errors.detail}
            </p>
          )}

          {/* Actions */}
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
