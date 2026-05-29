"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, AlertTriangle, Phone, Loader2 } from "lucide-react";
import { usePublicStats } from "@/hooks/usePublicStats";
import { submitReferralConversion } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const ref  = searchParams.get("ref")  ?? "";
  const org  = searchParams.get("org")  ?? "";

  const { stats, isLoading: statsLoading } = usePublicStats();

  const [phone, setPhone]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [waNumber, setWaNumber]     = useState("");
  const [error, setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.startsWith("+")) {
      setError("Enter phone in international format, e.g. +923001234567");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await submitReferralConversion({ ref, phone, source: "viral_landing" });
      setWaNumber(result.org_whatsapp_number);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Trust badge */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-8"
      >
        <Shield className="w-7 h-7 text-blue-400" />
        <span className="text-white text-xl font-bold tracking-tight">RealTron AI</span>
      </motion.div>

      {/* Stats ribbon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap justify-center gap-6 mb-10"
      >
        {statsLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        ) : stats ? (
          <>
            <StatPill label="Properties Verified" value={stats.total_verifications} />
            <StatPill label="Scams Caught"         value={stats.scams_caught} />
            <StatPill label="Active Agencies"      value={stats.active_orgs} />
          </>
        ) : null}
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
      >
        {submitted ? (
          <SuccessState waNumber={waNumber} />
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">
              Is this property safe?
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Enter your WhatsApp number and our AI will verify the property&apos;s
              legitimacy instantly — free.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+923001234567"
                    required
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                ) : (
                  "Verify via WhatsApp"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-4">
              No account needed. 100% free. Powered by AI.
            </p>
          </>
        )}
      </motion.div>

      <p className="mt-8 text-xs text-slate-600">
        © {new Date().getFullYear()} RealTron AI · realtron.ai
        {org ? ` · ${org}` : ""}
      </p>
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function SuccessState({ waNumber }: { waNumber: string }) {
  const link = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, "")}?text=Hi%2C%20I%20want%20to%20verify%20a%20property`
    : null;

  return (
    <div className="text-center space-y-4">
      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
      <h2 className="text-xl font-bold text-white">You&apos;re registered!</h2>
      <p className="text-slate-400 text-sm">
        Our AI will reach out on WhatsApp shortly. Or tap below to start now:
      </p>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors"
        >
          Open WhatsApp
        </a>
      )}
    </div>
  );
}

export default function PublicVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
