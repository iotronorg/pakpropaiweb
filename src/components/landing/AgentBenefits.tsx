"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, BarChart3, BrainCircuit, MessageCircle, Mic, Zap } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Zero Cold Leads — Ever",
    description:
      "AI qualifies every buyer by budget, intent, location, and urgency before the lead reaches you. No more time wasters. Every lead you receive is ready to transact.",
    highlight: true,
  },
  {
    icon: MessageCircle,
    title: "Link Your Existing WhatsApp Business",
    description:
      "No new app to download. Link your WhatsApp Business account and your entire CRM, lead history, and follow-up pipeline lives there. You already know how to use it.",
    highlight: false,
  },
  {
    icon: BadgeCheck,
    title: "Verified Badge = Instant Buyer Trust",
    description:
      "Complete our quick KYC process and earn the PakProp Verified badge. Buyers trust verified agents 3x more. Your profile ranks higher. More leads come to you automatically.",
    highlight: false,
  },
  {
    icon: Mic,
    title: "Voice to Listing in 60 Seconds",
    description:
      "Send a voice note describing a property — AI extracts location, size, price, type, and owner details and creates a structured listing for you. No typing, no forms.",
    highlight: true,
  },
  {
    icon: BrainCircuit,
    title: "AI Follow-Up That Never Sleeps",
    description:
      "AI automatically sends follow-up messages, reminders, and property suggestions to your leads at the right time — so you close deals even when you're with another client.",
    highlight: false,
  },
  {
    icon: BarChart3,
    title: "Analytics That Actually Matter",
    description:
      "See your lead conversion rate, average response time, listing performance, and deal close ratio. AI tells you which leads to prioritize and which listings to update.",
    highlight: false,
  },
];

const differentiators = [
  "No upfront cost — free to register",
  "No app to download or learn",
  "Works with your existing WhatsApp",
  "AI handles follow-ups automatically",
  "Scam protection for your reputation",
  "Verified badge builds buyer trust",
];

export default function AgentBenefits() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section id="agents" ref={ref} className="bg-gray-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-4"
        >
          <span className="inline-block bg-teal-50 text-teal-700 border border-teal-100 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            For Real Estate Agents
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Close More Deals.
            <br />
            <span className="text-teal-600">Do Less Chasing.</span>
          </h2>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            PakProp AI gives you AI-qualified leads, a WhatsApp CRM, and tools that close deals —
            not a new app to learn. You work smarter, not harder.
          </p>
        </motion.div>

        {/* What makes us different */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="mt-8 mb-14 flex flex-wrap justify-center gap-3"
        >
          {differentiators.map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 bg-white border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="text-teal-500">✓</span> {d}
            </span>
          ))}
        </motion.div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, title, description, highlight }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.2 + i * 0.08, ease: "easeOut" }}
              className={`flex flex-col gap-4 p-6 rounded-2xl border transition-all duration-200 ${
                highlight
                  ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200"
                  : "bg-white border-gray-100 hover:border-teal-200 hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlight ? "bg-white/20" : "bg-teal-50 border border-teal-100"}`}>
                <Icon size={18} className={highlight ? "text-white" : "text-teal-600"} />
              </div>
              <div>
                <h3 className={`text-sm font-bold leading-snug mb-2 ${highlight ? "text-white" : "text-gray-900"}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${highlight ? "text-teal-100" : "text-gray-500"}`}>{description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          className="mt-12 text-center"
        >
          <a
            href="#register"
            className="group inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-2xl transition-colors duration-150 shadow-sm text-base"
          >
            Register as Agent — It&apos;s Free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-150" />
          </a>
          <p className="mt-3 text-sm text-gray-400">No credit card. No commitment. Start receiving leads within 24 hours of approval.</p>
        </motion.div>
      </div>
    </section>
  );
}
