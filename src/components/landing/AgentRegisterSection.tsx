"use client";

import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAgent } from "@/lib/api";
import { ArrowRight, CheckCircle2, Loader2, UserPlus } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^\+92\d{10}$/, "Format: +92XXXXXXXXXX (13 characters)"),
  agent_type: z.enum(["individual", "developer", "agency"] as const, {
    error: "Select an agent type",
  }),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  primary_city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const perks = [
  "Free registration — no cost ever",
  "AI-qualified leads delivered to you",
  "WhatsApp CRM — no new app to learn",
  "KYC Verified badge builds buyer trust",
  "Voice-to-listing in 60 seconds",
  "Analytics dashboard access",
];

export default function AgentRegisterSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      await registerAgent({
        name: data.name,
        phone: data.phone,
        agent_type: data.agent_type,
        email: data.email ?? "",
        primary_city: data.primary_city ?? "",
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { phone?: string[]; detail?: string; non_field_errors?: string[] } } };
      const d = anyErr?.response?.data;
      setServerError(
        d?.phone?.[0] || d?.detail || d?.non_field_errors?.[0] || "Something went wrong. Please try again."
      );
    }
  }

  return (
    <section id="register" ref={ref} className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        {/* Left — pitch */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: -24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:sticky lg:top-24"
        >
          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            Join as Agent
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Pakistan&apos;s Fastest-Growing
            <br />
            <span className="text-emerald-600">Verified Agent Network.</span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed mb-8">
            Get AI-qualified leads, a WhatsApp CRM, and a Verified badge that makes buyers trust
            you instantly. Registration is completely free — start receiving leads within 24 hours of approval.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-start gap-2.5">
                <CheckCircle2 size={17} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 leading-snug">{perk}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <ArrowRight size={20} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">What happens after you apply?</div>
              <div className="text-sm text-gray-500 mt-0.5">
                Our team reviews your KYC within 24–48 hours. Once approved, your profile goes live and leads start flowing.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right — form */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: 24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {submitted ? (
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center gap-5 py-8"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    Our team will review your application within 24–48 hours. You&apos;ll receive a WhatsApp message once your account is activated.
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <UserPlus size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Agent Registration</h3>
                    <p className="text-xs text-gray-400">Free · 2 minutes · No credit card</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("name")}
                      placeholder="Muhammad Ahmed"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors placeholder:text-gray-400 bg-white"
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="+923001234567"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors placeholder:text-gray-400 bg-white"
                    />
                    {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>}
                  </div>

                  {/* Agent Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      I am a... <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("agent_type")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors bg-white cursor-pointer"
                    >
                      <option value="">Select your role...</option>
                      <option value="individual">Independent Agent</option>
                      <option value="developer">Property Developer</option>
                      <option value="agency">Real Estate Agency</option>
                    </select>
                    {errors.agent_type && <p className="mt-1.5 text-xs text-red-500">{errors.agent_type.message}</p>}
                  </div>

                  {/* Email + City row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email <span className="text-gray-400 font-normal text-xs">(optional)</span>
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors placeholder:text-gray-400 bg-white"
                      />
                      {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Primary City <span className="text-gray-400 font-normal text-xs">(optional)</span>
                      </label>
                      <input
                        {...register("primary_city")}
                        placeholder="Lahore, Karachi..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors placeholder:text-gray-400 bg-white"
                      />
                    </div>
                  </div>

                  {serverError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      {serverError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors duration-150 shadow-sm text-base cursor-pointer mt-1"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    ) : (
                      "Submit Application"
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    Applications reviewed within 24–48 hours. By submitting you agree to our verification process.
                  </p>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
