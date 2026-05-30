"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { sendOtp, verifyOtp, loginWithPassword } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { roleHomePath } from "@/lib/utils";
import { User } from "@/types";
import {
  ArrowLeft,
  Shield,
  MessageSquare,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

type Mode = "password" | "otp-phone" | "otp-code" | "no-access";

const stepVariants = {
  enter:  { opacity: 0, x: 16  },
  center: { opacity: 1, x: 0   },
  exit:   { opacity: 0, x: -16 },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<Mode>("password");

  // Password form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow state
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode,  setOtpCode]  = useState("");

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const registered = searchParams.get("registered") === "true";

  function switchMode(next: Mode) {
    setError("");
    setMode(next);
  }

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginWithPassword(identifier, password);
      const { user } = res.data as { user: User };
      if (user.role === "client") { setMode("no-access"); return; }
      setAuth(user);
      router.replace(roleHomePath(user.role));
    } catch {
      setError("Invalid credentials. Check your email/phone and password.");
    } finally {
      setLoading(false);
    }
  }

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendOtp(otpPhone);
      setMode("otp-code");
    } catch {
      setError("Could not send OTP. Check the phone number.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await verifyOtp(otpPhone, otpCode);
      const { user } = res.data as { user: User };
      setOtpCode("");
      if (user.role === "client") { setMode("no-access"); return; }
      setAuth(user);
      router.replace(roleHomePath(user.role));
    } catch {
      setError("Invalid or expired OTP.");
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
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
            Back to home
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
          {/* Registered success banner */}
          <AnimatePresence>
            {registered && mode !== "no-access" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 border-b border-green-100 bg-green-50 px-6 py-3 text-sm text-green-700"
              >
                <CheckCircle2 size={15} className="shrink-0 text-green-600" />
                Account created. Please sign in.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* No-access */}
            {mode === "no-access" && (
              <motion.div
                key="no-access"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-8 text-center space-y-5"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 border border-teal-200">
                  <MessageSquare size={22} className="text-teal-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-[var(--text-primary)]">Use WhatsApp to continue</h1>
                  <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                    Your account uses RealTron AI via WhatsApp. The dashboard is only available for agents, developers, and admins.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => switchMode("password")}
                  className="w-full rounded-lg border border-[var(--border)] py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  Sign in with a different account
                </motion.button>
              </motion.div>
            )}

            {/* Password mode (default) */}
            {mode === "password" && (
              <motion.form
                key="password"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={onPasswordLogin}
                className="space-y-5 p-8"
              >
                <div>
                  <h1 className="text-lg font-semibold text-[var(--text-primary)]">Sign in</h1>
                  <div className="mt-1 h-px bg-[var(--border)]" />
                </div>

                {/* Identifier */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Email or phone
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or +92 300 123 4567"
                    required
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 pe-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
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

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                    : "Sign In →"}
                </motion.button>

                {/* Secondary actions */}
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    onClick={() => {/* TODO: forgot password flow */}}
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("otp-phone")}
                    className="text-sky-600 hover:text-sky-700 font-medium transition-colors cursor-pointer"
                  >
                    Continue with OTP &rarr;
                  </button>
                </div>
              </motion.form>
            )}

            {/* OTP — phone step */}
            {mode === "otp-phone" && (
              <motion.form
                key="otp-phone"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={onSendOtp}
                className="space-y-5 p-8"
              >
                <div>
                  <h1 className="text-lg font-semibold text-[var(--text-primary)]">Sign in with OTP</h1>
                  <div className="mt-1 h-px bg-[var(--border)]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Phone number</label>
                  <input
                    type="tel"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    placeholder="+92 300 1234567"
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
                    : "Send OTP →"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => switchMode("password")}
                  className="flex w-full items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  Back to password login
                </button>
              </motion.form>
            )}

            {/* OTP — code step */}
            {mode === "otp-code" && (
              <motion.form
                key="otp-code"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={onVerifyOtp}
                className="space-y-5 p-8"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200">
                    <Shield size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">Enter OTP</h1>
                    <p className="text-xs text-[var(--text-muted)]">
                      Sent to <span className="font-medium text-sky-600">{otpPhone}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="• • • • • •"
                    required
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-center text-lg font-bold tracking-[0.35em] text-[var(--text-primary)] placeholder:text-slate-300 placeholder:tracking-normal outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
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
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Verifying…</>
                    : "Verify & Sign in"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => { switchMode("otp-phone"); setOtpCode(""); }}
                  className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Use a different number
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
