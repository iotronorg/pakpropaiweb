"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Search, Star, ShieldCheck, Handshake, Lock, RotateCcw, ArrowRight } from "lucide-react";

const stages = [
  { icon: Search,      label: "Discover",   color: "#2563EB", desc: "AI surfaces matching inventory from first WhatsApp message" },
  { icon: Star,        label: "Qualify",    color: "#4F46E5", desc: "Every lead scored 0–100 on intent, budget & urgency" },
  { icon: ShieldCheck, label: "Verify",     color: "#0891B2", desc: "Documents, listings & ownership verified by AI in seconds" },
  { icon: Handshake,   label: "Connect",    color: "#7C3AED", desc: "Hot leads routed to the best-fit agent automatically" },
  { icon: Lock,        label: "Transact",   color: "#6366F1", desc: "Deal locked via escrow — fully auditable, fully protected" },
  { icon: RotateCcw,   label: "Retain",     color: "#0284C7", desc: "AI keeps clients engaged for referrals & repeat business" },
];

export default function WorkflowVisualization() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} className="bg-slate-50 py-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            AI-Orchestrated Pipeline
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Every Stage of the Deal.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Fully Automated.
            </span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            From first inquiry to closed deal — AI handles qualification, verification,
            routing, and follow-up at every stage without manual intervention.
          </p>
        </motion.div>

        {/* Desktop: horizontal pipeline */}
        <div className="hidden lg:flex items-start gap-0 relative">
          {stages.map(({ icon: Icon, label, color, desc }, i) => (
            <div key={label} className="flex items-start flex-1">
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: prefersReduced ? 0 : i * 0.1, ease: "easeOut" }}
                className="flex-1 flex flex-col items-center text-center px-3 group"
              >
                {/* Icon circle */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white shadow-sm group-hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: color + "15", border: `1.5px solid ${color}30` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>

                {/* Step number */}
                <div className="text-[10px] font-bold tracking-widest text-slate-400 mb-1">
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Label */}
                <div className="text-sm font-bold text-slate-900 mb-2">{label}</div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>

              {/* Arrow connector */}
              {i < stages.length - 1 && (
                <div className="flex items-center pt-6 shrink-0">
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical list */}
        <div className="lg:hidden flex flex-col gap-4">
          {stages.map(({ icon: Icon, label, color, desc }, i) => (
            <motion.div
              key={label}
              initial={prefersReduced ? false : { opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: prefersReduced ? 0 : i * 0.07, ease: "easeOut" }}
              className="flex items-start gap-4 bg-white rounded-xl p-4 border border-slate-200"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + "15", border: `1px solid ${color}30` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-slate-400 mb-0.5">
                  STAGE {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-sm font-bold text-slate-900 mb-1">{label}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.7 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-slate-400">
            Every stage is logged, auditable, and visible in your organization dashboard in real time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
