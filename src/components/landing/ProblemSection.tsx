"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { TableProperties, UserX, BrainCircuit, CheckCircle2 } from "lucide-react";

const problems = [
  {
    icon: TableProperties,
    title: "Sales Operations Still Run on Spreadsheets",
    stat: "73%",
    statLabel: "of real estate orgs have no unified sales system",
    description:
      "Leads arrive across email, WhatsApp, portals, and referrals — scattered across tools, lost between handoffs, tracked in spreadsheets no one updates consistently.",
    fix: "RealTron AI centralizes every inquiry into one AI-powered CRM. Every lead is captured, scored, and routed — automatically, from first message.",
    color: "#EF4444",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    icon: UserX,
    title: "Leads Go Cold Before Agents Respond",
    stat: "78%",
    statLabel: "of leads never receive a timely follow-up",
    description:
      "The average real estate organization takes hours to respond to a new inquiry. By then, the buyer has moved on. Speed-to-lead is the single biggest factor in conversion — and most teams are losing it.",
    fix: "AI qualifies and responds to every lead within seconds — on WhatsApp, 24/7 — and routes hot leads to agents with a full brief before first contact.",
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: BrainCircuit,
    title: "No Intelligence Between Inquiry and Transaction",
    stat: "0",
    statLabel: "AI layer in the typical real estate sales stack",
    description:
      "Most organizations have no automated qualification, no scoring, no routing intelligence, and no AI follow-up layer. Every step depends on a human doing it manually — which means deals slip through every day.",
    fix: "RealTron AI is the operating layer between inquiry and transaction — qualifying, verifying, routing, and accelerating every deal automatically.",
    color: "#8B5CF6",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
];

export default function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-red-50 text-red-600 border border-red-100 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            The Problem
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Real Estate Sales Is Still
            <br />
            <span className="text-red-500">Stuck in Manual Mode.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Fragmented tools, slow follow-ups, and zero AI intelligence cost organizations
            millions in missed deals every year — across every market.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-7">
          {problems.map(({ icon: Icon, title, stat, statLabel, description, fix, color, bg, border }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: prefersReduced ? 0 : i * 0.15, ease: "easeOut" }}
              className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              <div className={`${bg} ${border} border-b px-6 py-5 flex items-center gap-4`}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + "20" }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 leading-none">{stat}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{statLabel}</div>
                </div>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4 flex-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <p className="text-sm text-emerald-700 font-medium leading-relaxed flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />{fix}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
