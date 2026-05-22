"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Search, Star, ShieldCheck, Handshake, MessageSquare, Lock, RotateCcw } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Discover",
    tagline: "AI finds the right properties",
    description:
      "Buyers message your AI on WhatsApp in any language. The AI extracts intent, budget, location, and preferences — then surfaces matching inventory from your portfolio instantly.",
    color: "#2563EB",
  },
  {
    icon: Star,
    step: "02",
    title: "Qualify",
    tagline: "AI scores every lead automatically",
    description:
      "Every conversation is scored 0–100 by AI: intent clarity, budget precision, follow-up signals, and recency. Only qualified leads are surfaced to agents — no manual triage.",
    color: "#4F46E5",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Verify",
    tagline: "Trust before transaction",
    description:
      "Buyers can submit documents, listing links, or screenshots. AI performs OCR, ownership cross-checks, tampering detection, and delivers a shareable trust report.",
    color: "#0891B2",
  },
  {
    icon: Handshake,
    step: "04",
    title: "Connect",
    tagline: "AI routes leads to the right agent",
    description:
      "Qualified buyers are matched to the best-fit agent based on geography, specialization, workload, and language. The agent receives the lead brief before first contact.",
    color: "#7C3AED",
  },
  {
    icon: MessageSquare,
    step: "05",
    title: "Negotiate",
    tagline: "AI assists agents at every step",
    description:
      "Agents get AI-suggested replies, auto-follow-up reminders, and property recommendations to share with buyers. The AI keeps deals moving without manual effort.",
    color: "#0284C7",
  },
  {
    icon: Lock,
    step: "06",
    title: "Transact",
    tagline: "Secure deal lock with escrow",
    description:
      "Buyers lock deals with token payments held in escrow. 48-hour exclusivity, full audit trails, both parties protected. Funds flow through payment gateways — never through us.",
    color: "#6366F1",
  },
  {
    icon: RotateCcw,
    step: "07",
    title: "Retain",
    tagline: "AI keeps clients engaged",
    description:
      "Post-transaction AI outreach, investment updates, and property alerts keep clients in your funnel. Referrals and repeat business are automated through WhatsApp.",
    color: "#2563EB",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section id="how-it-works" ref={ref} className="bg-slate-50 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            End-to-End Platform Flow
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            From First Message
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              to Closed Deal.
            </span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
            Seven AI-orchestrated stages — every step automated, every interaction logged,
            every deal traceable.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {steps.map(({ icon: Icon, step, title, tagline, description, color }, i) => (
            <motion.div
              key={step}
              initial={prefersReduced ? false : { opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: prefersReduced ? 0 : i * 0.07, ease: "easeOut" }}
              className="group relative bg-white hover:shadow-sm border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all duration-200 flex flex-col sm:flex-row gap-5 items-start"
            >
              <div
                className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: color }}
              />

              <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2 sm:w-14 shrink-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + "10", border: `1px solid ${color}22` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="text-[10px] font-bold text-slate-400 tracking-widest">{step}</div>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">{title}</h3>
                <p className="text-xs font-semibold mb-2" style={{ color }}>{tagline}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>

              <div
                className="shrink-0 self-start mt-0.5 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border"
                style={{ color, borderColor: color + "30", backgroundColor: color + "08" }}
              >
                Stage {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
