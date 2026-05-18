"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { sendOtp, verifyOtp } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { roleHomePath } from "@/lib/utils";
import { User } from "@/types";
import { ArrowLeft, Phone, Shield, MessageSquare, Loader2 } from "lucide-react";

const phoneSchema = z.object({ phone: z.string().min(10, "Enter a valid phone number") });
const otpSchema   = z.object({ code:  z.string().length(6, "OTP must be 6 digits") });

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm   = z.infer<typeof otpSchema>;
type Step      = "phone" | "otp" | "no-access";

const stepVariants = {
  enter:  { opacity: 0, x: 16  },
  center: { opacity: 1, x: 0   },
  exit:   { opacity: 0, x: -16 },
};

export default function LoginPage() {
  const router   = useRouter();
  const { setAuth } = useAuthStore();
  const [step,    setStep]    = useState<Step>("phone");
  const [phone,   setPhone]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm   = useForm<OtpForm>  ({ resolver: zodResolver(otpSchema) });

  async function onSendOtp(data: PhoneForm) {
    setLoading(true); setError("");
    try {
      await sendOtp(data.phone);
      setPhone(data.phone);
      phoneForm.reset();
      setStep("otp");
    } catch { setError("Could not send OTP. Check the phone number."); }
    finally  { setLoading(false); }
  }

  async function onVerifyOtp(data: OtpForm) {
    setLoading(true); setError("");
    try {
      const res = await verifyOtp(phone, data.code);
      const { user } = res.data as { user: User };
      otpForm.reset();
      if (user.role === "client") { setStep("no-access"); return; }
      setAuth(user);
      // user_role cookie is now set server-side as HttpOnly by the Django auth endpoint.
      // Do not set it here — client-side cookie would be tamper-able via XSS.
      router.replace(roleHomePath(user.role));
    } catch { setError("Invalid or expired OTP."); }
    finally  { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm">

        {/* Back link */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
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
          <AnimatePresence mode="wait">

            {/* No-access */}
            {step === "no-access" && (
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
                  onClick={() => { setStep("phone"); setError(""); }}
                  className="w-full rounded-lg border border-[var(--border)] py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  Sign in with a different number
                </motion.button>
              </motion.div>
            )}

            {/* Phone step */}
            {step === "phone" && (
              <motion.form
                key="phone"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={phoneForm.handleSubmit(onSendOtp)}
                className="space-y-5 p-8"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-200">
                    <Phone size={18} className="text-sky-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">Sign in</h1>
                    <p className="text-xs text-[var(--text-muted)]">Enter your WhatsApp number</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Phone number</label>
                  <input
                    {...phoneForm.register("phone")}
                    type="tel"
                    placeholder="+92 300 1234567"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                  {phoneForm.formState.errors.phone && (
                    <p className="mt-1.5 text-xs text-red-600">{phoneForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600"
                    >{error}</motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : "Send OTP"}
                </motion.button>
              </motion.form>
            )}

            {/* OTP step */}
            {step === "otp" && (
              <motion.form
                key="otp"
                variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={otpForm.handleSubmit(onVerifyOtp)}
                className="space-y-5 p-8"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200">
                    <Shield size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">Enter OTP</h1>
                    <p className="text-xs text-[var(--text-muted)]">
                      Sent to <span className="font-medium text-sky-600">{phone}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">6-digit code</label>
                  <input
                    {...otpForm.register("code")}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-center text-lg font-bold tracking-[0.35em] text-[var(--text-primary)] placeholder:text-slate-300 placeholder:tracking-normal outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                  {otpForm.formState.errors.code && (
                    <p className="mt-1.5 text-xs text-red-600">{otpForm.formState.errors.code.message}</p>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600"
                    >{error}</motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : "Verify & Sign in"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => { setStep("phone"); setError(""); phoneForm.reset(); otpForm.reset(); }}
                  className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Use a different number
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}
          className="mt-6 text-center text-xs text-[var(--text-faint)]"
        >
          Dashboard access for agents, developers & admins only
        </motion.p>
      </div>
    </div>
  );
}
