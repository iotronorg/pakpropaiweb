"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerOrganization, verifyOrgRegistrationOtp } from "@/lib/api";

const ORG_TYPES = [
  { value: "developer",  label: "Real Estate Developer", desc: "Residential & commercial projects" },
  { value: "agency",     label: "Agency / Brokerage",    desc: "Sales & leasing operations" },
  { value: "brokerage",  label: "Brokerage Firm",        desc: "Mortgage & transaction services" },
  { value: "enterprise", label: "Enterprise / Corporate", desc: "Multi-office or corporate portfolio" },
];

const COUNTRIES = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "PK", name: "Pakistan" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "IN", name: "India" },
  { code: "BD", name: "Bangladesh" },
  { code: "TR", name: "Turkey" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
];

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

const STRENGTH: Record<PasswordStrength, { label: string; bar: string; text: string }> = {
  too_short: { label: "Too short",   bar: "w-1/4 bg-red-500",    text: "text-red-500"    },
  weak:      { label: "Weak",        bar: "w-1/4 bg-red-500",    text: "text-red-500"    },
  fair:      { label: "Fair",        bar: "w-2/4 bg-amber-400",  text: "text-amber-500"  },
  strong:    { label: "Strong",      bar: "w-full bg-green-500", text: "text-green-600"  },
};

const BLANK = {
  org_name:   "",
  org_type:   "agency",
  country:    "",
  admin_name: "",
  phone:      "",
  email:      "",
  password:   "",
  confirm:    "",
};

type FormState = typeof BLANK;

export default function OrgRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  const pwStrength = form.password ? getPasswordStrength(form.password) : null;

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (form.password !== form.confirm) {
      setErrors({ confirm: "Passwords do not match." });
      return;
    }
    if (!form.country) {
      setErrors({ country: "Please select a country." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerOrganization({
        org_name:   form.org_name.trim(),
        org_type:   form.org_type,
        country:    form.country,
        admin_name: form.admin_name.trim(),
        phone:      form.phone.trim(),
        email:      form.email.trim(),
        password:   form.password,
      });
      const data = res.data as Record<string, unknown>;
      if (data?.otp_required) {
        setOtpPhone(form.phone.trim());
        setOtpStep(true);
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
      await verifyOrgRegistrationOtp(otpPhone, otpCode);
      router.push("/organization/onboarding");
    } catch {
      setOtpError("Invalid or expired code. Please try again.");
    } finally {
      setOtpSubmitting(false);
    }
  }

  // ── OTP step ──────────────────────────────────────────────────────────────────
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
            <h2 className="text-xl font-bold text-gray-900">Verify your phone</h2>
            <p className="mt-2 text-sm text-gray-500">
              We sent a 6-digit code to your WhatsApp at{" "}
              <span className="font-medium text-gray-700">{otpPhone}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                otpError ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
              required
              autoFocus
            />
            {otpError && <p className="text-xs text-red-500">{otpError}</p>}

            <button
              type="submit"
              disabled={otpSubmitting || otpCode.length < 6}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {otpSubmitting ? "Verifying..." : "Verify & Continue to Setup"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <a
          href="/register"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Agent registration
        </a>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Register your organization</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up your workspace on RealTron AI. You&apos;ll be up and running in under 2 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Org type selector */}
          <Block title="Organization Type">
            <div className="grid grid-cols-2 gap-3">
              {ORG_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("org_type", t.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${
                    form.org_type === t.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.org_type === t.value ? "text-blue-700" : "text-gray-800"}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </Block>

          {/* Org details */}
          <Block title="Organization Details">
            <Field label="Organization Name" required error={errors.org_name}>
              <input
                type="text"
                value={form.org_name}
                onChange={(e) => set("org_name", e.target.value)}
                placeholder="Apex Realty Group"
                className={inp(errors.org_name)}
                required
              />
            </Field>

            <Field label="Country" required error={errors.country}>
              <select
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={inp(errors.country)}
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </Field>
          </Block>

          {/* Admin account */}
          <Block title="Admin Account">
            <Field label="Your Full Name" required error={errors.admin_name}>
              <input
                type="text"
                value={form.admin_name}
                onChange={(e) => set("admin_name", e.target.value)}
                placeholder="Alice Smith"
                className={inp(errors.admin_name)}
                required
              />
            </Field>

            <Field label="Business Email" required error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="alice@apexrealty.com"
                className={inp(errors.email)}
                required
              />
            </Field>

            <Field
              label="Phone (WhatsApp)"
              required
              error={errors.phone}
              hint="E.164 format — e.g. +441234567890 or +971501234567"
            >
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+441234567890"
                className={inp(errors.phone)}
                required
              />
            </Field>

            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Create a password"
                  className={inp(errors.password) + " pr-10"}
                  required
                />
                <EyeToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />
              </div>
              {form.password && pwStrength && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${STRENGTH[pwStrength].bar}`} />
                  </div>
                  <p className={`mt-1 text-xs font-medium ${STRENGTH[pwStrength].text}`}>
                    {STRENGTH[pwStrength].label}
                  </p>
                </div>
              )}
            </Field>

            <Field label="Confirm Password" required error={errors.confirm}>
              <div className="relative">
                <input
                  type={showCf ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  placeholder="Repeat your password"
                  className={inp(errors.confirm) + " pr-10"}
                  required
                />
                <EyeToggle show={showCf} onToggle={() => setShowCf((v) => !v)} />
              </div>
            </Field>
          </Block>

          {/* Global error */}
          {errors.detail && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {errors.detail}
            </p>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating workspace..." : "Create Workspace"}
            </button>
            <a
              href="/login"
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Sign in
            </a>
          </div>

          <p className="text-center text-xs text-gray-400">
            By registering you agree to the{" "}
            <a href="/terms" className="underline hover:text-gray-600">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inp(err?: string) {
  return `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    err ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
  }`;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
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
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
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

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={show ? "Hide password" : "Show password"}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}
