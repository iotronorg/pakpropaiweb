"use client";

import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, MessageCircle, BarChart3, ShieldCheck, Users, Building2,
  Zap, FileSearch, TrendingUp, GitFork, Bell, Lock
} from "lucide-react";

const categories = [
  {
    id: "ai",
    label: "AI Infrastructure",
    color: "#4F46E5",
    features: [
      { icon: BrainCircuit, title: "AI Lead Qualification", desc: "Every lead scored 0–100 across intent, budget, engagement, and recency. Hot leads surface automatically." },
      { icon: GitFork, title: "AI Lead Routing", desc: "AI assigns leads to the best-fit agent based on specialization, geography, workload, and language match." },
      { icon: Bell, title: "AI Follow-Up Automation", desc: "Automated follow-up reminders and WhatsApp messages keep deals warm without manual effort from agents." },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp Automation",
    color: "#0891B2",
    features: [
      { icon: MessageCircle, title: "WhatsApp AI Assistant", desc: "Natural language property search, scam checks, loan guidance, and agent matching — all via WhatsApp." },
      { icon: Zap, title: "Multi-Format Input", desc: "Accept voice notes, images, PDFs, listing links, and screenshots. AI processes all formats automatically." },
      { icon: TrendingUp, title: "Conversation Intelligence", desc: "Every conversation analyzed for intent, budget signals, and sentiment. Full history stored in CRM." },
    ],
  },
  {
    id: "crm",
    label: "CRM Intelligence",
    color: "#2563EB",
    features: [
      { icon: BarChart3, title: "Pipeline Analytics", desc: "Real-time funnel visibility from first message to closed deal. Track conversion rates and identify bottlenecks." },
      { icon: Users, title: "Team Management", desc: "Add agents, assign territories, set performance targets, and track KPIs — all from one dashboard." },
      { icon: TrendingUp, title: "Sales Forecasting", desc: "AI predicts deal close probability and forecasts revenue based on pipeline health and historical patterns." },
    ],
  },
  {
    id: "inventory",
    label: "Property Intelligence",
    color: "#0284C7",
    features: [
      { icon: Building2, title: "Inventory Management", desc: "Upload units at scale. AI enriches listings with area intelligence, investment scores, and buyer-friendly descriptions." },
      { icon: BrainCircuit, title: "AI Recommendations", desc: "Recommendations engine matches properties to leads based on city, intent, budget, and AI score." },
      { icon: BarChart3, title: "Market Intelligence", desc: "Price benchmarking, demand signals, and competitor analysis help you price and promote inventory effectively." },
    ],
  },
  {
    id: "verification",
    label: "Verification & Trust",
    color: "#7C3AED",
    features: [
      { icon: ShieldCheck, title: "Document Verification", desc: "OCR + AI validates ownership documents, detects tampering, and cross-checks records. Shareable trust certificate." },
      { icon: FileSearch, title: "Scam Detection", desc: "AI-generated risk scores on any listing within 30 seconds. Red flags, fraud indicators, and trust analysis." },
      { icon: Lock, title: "Secure Deal Lock", desc: "Token payments held in escrow. 48-hour exclusivity. Full audit trails. Neither party can dispute the chain." },
    ],
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();
  const [active, setActive] = useState("ai");
  const cat = categories.find((c) => c.id === active)!;

  return (
    <section id="features" ref={ref} className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Platform Capabilities
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Every Layer of Your
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Sales Infrastructure.
            </span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            AI, CRM, WhatsApp automation, verification, and deal management — unified in one platform.
          </p>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${
                active === c.id
                  ? "bg-white border-slate-300 text-slate-900 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </motion.div>

        {/* Feature cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid md:grid-cols-3 gap-5"
          >
            {cat.features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: prefersReduced ? 0 : i * 0.07, ease: "easeOut" }}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: cat.color + "12", border: `1px solid ${cat.color}25` }}
                >
                  <Icon size={18} style={{ color: cat.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
