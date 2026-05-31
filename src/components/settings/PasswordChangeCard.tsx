"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { changePassword } from "@/lib/api";
import { AxiosError } from "axios";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

function PasswordField({ id, label, value, onChange, placeholder, autoComplete }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2.5 pe-10 text-sm text-[var(--text-primary)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {show ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus]   = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (next !== confirm) {
      setStatus({ type: "error", message: "New passwords do not match." });
      return;
    }
    setPending(true);
    try {
      await changePassword(current, next);
      setStatus({ type: "success", message: "Password updated successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string; current_password?: string[] }>;
      const detail =
        axiosErr.response?.data?.current_password?.[0] ??
        axiosErr.response?.data?.detail ??
        "Failed to update password. Please try again.";
      setStatus({ type: "error", message: detail });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Security</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Change your account password.</p>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <PasswordField id="current-password" label="Current password" value={current} onChange={setCurrent}
          placeholder="Current password" autoComplete="current-password" />
        <PasswordField id="new-password"     label="New password"     value={next}    onChange={setNext}
          placeholder="New password"     autoComplete="new-password" />
        <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm}
          placeholder="Confirm new password" autoComplete="new-password" />

        {status && (
          <div
            role="alert"
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
              status.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {status.type === "success" && <CheckCircle2 size={14} aria-hidden="true" />}
            {status.message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !current || !next || !confirm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {pending
              ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Updating…</>
              : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
