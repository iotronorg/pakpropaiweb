"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  BrainCircuit, Zap, ShieldAlert, FileSearch, BarChart3,
  MessageSquare, Users, TrendingUp, Building2, GitFork, Bell, Globe
} from "lucide-react";

const capabilities = [
  { icon: BrainCircuit, title: "Lead Qualification AI", desc: "Scores every lead 0–100 on intent, budget, engagement, and recency.", color: "#4F46E5" },
  { icon: GitFork, title: "Intelligent Routing", desc: "Matches leads to best-fit agents by geo, spec, and workload.", color: "#2563EB" },
  { icon: MessageSquare, title: "Conversation Intelligence", desc: "Extracts intent, budget, and sentiment from every WhatsApp exchange.", color: "#0891B2" },
  { icon: ShieldAlert, title: "Fraud Detection", desc: "Generates scam risk scores from listing links, screenshots, or descriptions.", color: "#DC2626" },
  { icon: FileSearch, title: "Document Verification", desc: "OCR + AI validates ownership docs, detects tampering, issues trust certs.", color: "#0284C7" },
  { icon: BarChart3, title: "Sales Forecasting", desc: "Predicts close probability and forecasts revenue from pipeline signals.", color: "#7C3AED" },
  { icon: Building2, title: "Property Recommendations", desc: "Matches inventory to leads via city, intent, budget, and AI score.", color: "#2563EB" },
  { icon: Bell, title: "Automated Follow-Ups", desc: "AI schedules and sends follow-up reminders to agents and buyers.", color: "#6366F1" },
  { icon: TrendingUp, title: "Market Intelligence", desc: "Price benchmarks, demand signals, and competitor pricing for inventory.", color: "#4F46E5" },
  { icon: Users, title: "Agent Productivity AI", desc: "Suggests replies, surfaces relevant properties, prioritizes daily tasks.", color: "#0891B2" },
  { icon: Zap, title: "AI Deal Acceleration", desc: "Identifies stalled deals and recommends actions to unblock them.", color: "#2563EB" },
  { icon: Globe, title: "Multi-Country AI", desc: "Tax, loan, and compliance logic for PK, AE, GB, US markets.", color: "#0284C7" },
];

export default function AiCapabilitiesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section id="ai" ref={ref} className="bg-slate-900 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-white/8 text-indigo-300 border border-white/10 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            AI Is the Operating Layer
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            12 AI Capabilities.
            <br />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              One Unified Platform.
            </span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            AI is not a feature here — it is the core operating layer that runs qualification,
            routing, verification, forecasting, and follow-ups automatically.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {capabilities.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: prefersReduced ? 0 : i * 0.04, ease: "easeOut" }}
              className="bg-white/5 border border-white/8 hover:bg-white/8 hover:border-white/15 rounded-xl p-4 flex flex-col gap-3 transition-all duration-200"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + "20", border: `1px solid ${color}35` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-snug mb-1">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-xs text-slate-500 mt-10"
        >
          Powered by Gemini 2.5 Flash · GPT-4 Turbo · Custom fine-tuned models for real estate
        </motion.p>
      </div>
    </section>
  );
}
