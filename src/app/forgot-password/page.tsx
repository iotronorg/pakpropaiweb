"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { requestPasswordReset, confirmPasswordReset, getMe } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { roleHomePath } from "@/lib/utils";
import { User } from "@/types";
import { ArrowLeft, Shield, Loader2, Eye, EyeOff } from "lucide-react";

type Step = "phone" | "confirm";

const stepVariants = {
  enter:  { opacity: 0, x: 16  },
  center: { opacity: 1, x: 0   },
  exit:   { opacity: 0, x: -16 },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep]       = useState<Step>("phone");
  const [phone, setPhone]     = useState("");
  const [code, setCode]       = useState("");
  const [newPwd, setNewPwd]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [resent,  setResent]  = useState(false);

  async function onRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(phone);
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setResent(false);
    setError("");
    try {
      await requestPasswordReset(phone);
      setResent(true);
    } catch {
      // endpoint always returns 200 — silently swallow network errors
    }
  }

  async function onConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await confirmPasswordReset(phone, code, newPwd);
      // Backend issues auth cookies on success — fetch the current user then redirect
      const res = await getMe();
      const user = res.data as User;
      setAuth(user);
      router.replace(roleHomePath(user.role));
    } catch {
      setError("Invalid or expired reset code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm">

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
            Back to login
          </Link>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">RealTron</span>
            <span className="rounded-md bg-sky-50 px-2 py-1 text-sm font-semibold text-sky-600 border border-sky-200">AI</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">AI Sales Infrastructure for Real Estate</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm"
        >
          <AnimatePresence mode="wait">

            {/* Step 1 — phone */}
            {step === "phone" && (
              <motion.form
                key="phone"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={onRequestReset}
                className="space-y-5 p-8"
              >
                <div>
                  <h1 className="text-lg font-semibold text-[var(--text-primary)]">Forgot password</h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Enter your phone number and we&apos;ll send a reset code.
                  </p>
                  <div className="mt-3 h-px bg-[var(--border)]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Phone number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+923001234567"
                    required
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                    : "Send Reset Code →"}
                </motion.button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={11} />
                    Back to login
                  </Link>
                </div>
              </motion.form>
            )}

            {/* Step 2 — OTP + new password */}
            {step === "confirm" && (
              <motion.form
                key="confirm"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={onConfirmReset}
                className="space-y-5 p-8"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-200">
                    <Shield size={18} className="text-sky-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">Reset your password</h1>
                    <p className="text-xs text-[var(--text-muted)]">
                      Code sent to <span className="font-medium text-sky-600">{phone}</span>
                    </p>
                  </div>
                </div>

                {/* Sent confirmation banner */}
                <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-2.5 text-xs text-sky-700">
                  If that number is registered, a reset code was sent to your WhatsApp.
                </div>

                <div className="mt-1 h-px bg-[var(--border)]" />

                {/* OTP code */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Reset code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="• • • • • •"
                    required
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-center text-lg font-bold tracking-[0.35em] text-[var(--text-primary)] placeholder:text-slate-300 placeholder:tracking-normal outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>

                {/* New password */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 pe-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Confirm password
                  </label>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Resetting…</>
                    : "Reset Password →"}
                </motion.button>

                <AnimatePresence>
                  {resent && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-center text-xs text-green-600"
                    >
                      Code resent to your WhatsApp.
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={onResend}
                  className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Resend code
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="mt-6 text-center text-xs text-[var(--text-faint)]"
        >
          Dashboard access for agents, developers &amp; admins only
        </motion.p>
      </div>
    </div>
  );
}
