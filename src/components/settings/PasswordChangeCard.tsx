"use client";

import { useState } from "react";
import { changePassword } from "@/lib/api";
import { AxiosError } from "axios";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function PasswordField({ id, label, value, onChange, placeholder }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-14 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
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
      setStatus({ type: "success", message: "Password updated." });
      setCurrent("");
      setNext("");
      setConfirm("");
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
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-800">Security</h2>
        <p className="text-xs text-gray-400 mt-0.5">Change your account password.</p>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <PasswordField
          id="current-password"
          label="Current password"
          value={current}
          onChange={setCurrent}
          placeholder="Current password"
        />
        <PasswordField
          id="new-password"
          label="New password"
          value={next}
          onChange={setNext}
          placeholder="New password"
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Confirm new password"
        />
        {status && (
          <p
            className={`text-sm font-medium ${
              status.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.message}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !current || !next || !confirm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {pending ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
