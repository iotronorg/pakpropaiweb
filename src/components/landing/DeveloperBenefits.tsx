"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Building, GitFork, LayoutDashboard, LineChart, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Users,
    title: "Manage Your Entire Sales Team",
    description:
      "Add agents, assign territories, set targets, and monitor performance — all from a single dashboard. No spreadsheets, no WhatsApp groups for reporting.",
  },
  {
    icon: GitFork,
    title: "AI Lead Distribution That Maximises Closures",
    description:
      "AI routes each lead to the best-matched agent based on location, budget, availability, and past performance. Right lead, right agent, right time.",
  },
  {
    icon: Building,
    title: "List Inventory at Scale",
    description:
      "Upload hundreds of units at once. AI enriches each listing — extracts location intelligence, adds area context, auto-generates buyer-friendly descriptions.",
  },
  {
    icon: LayoutDashboard,
    title: "Real-Time Sales Funnel",
    description:
      "See every lead from first WhatsApp message to closed deal. Track conversion rates, identify bottlenecks, and see exactly where deals are being lost.",
  },
  {
    icon: LineChart,
    title: "Market Intelligence Built In",
    description:
      "AI analyses your inventory against market trends, competitor pricing, and buyer demand — and tells you when to adjust pricing or promote specific units.",
  },
  {
    icon: ShieldCheck,
    title: "Your Data Stays Yours",
    description:
      "Strict org-level isolation. Your inventory, leads, and analytics are invisible to other organisations on the platform. Complete data privacy.",
  },
];

const metrics = [
  { value: "3x", label: "faster lead response time" },
  { value: "40%", label: "improvement in conversion" },
  { value: "Zero", label: "missed follow-ups with AI" },
];

export default function DeveloperBenefits() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section id="developers" ref={ref} className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid lg:grid-cols-2 gap-12 items-center mb-16"
        >
          <div>
            <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              For Developers & Agencies
            </span>
            <h2
              className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
              style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
            >
              Scale Your Sales.
              <br />
              <span className="text-indigo-600">AI Does the Heavy Lifting.</span>
            </h2>
            <p className="mt-5 text-lg text-slate-500 leading-relaxed">
              Give your sales team an unfair advantage. AI qualifies leads, routes them to the
              right agent, follows up automatically, and gives you complete visibility into your
              pipeline — across every project, city, and team.
            </p>
            <div className="mt-7 flex flex-wrap gap-6">
              {metrics.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-extrabold text-indigo-600">{value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline preview */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-700">Lead Pipeline</span>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">Live</span>
              </div>
              {[
                { name: "Ahmed Al-Rashid", budget: "$1.2M", status: "Hot Lead", bar: "w-4/5", color: "bg-blue-600" },
                { name: "Sarah Williams", budget: "$650K", status: "Visiting", bar: "w-3/5", color: "bg-sky-500" },
                { name: "James Chen", budget: "$2.5M", status: "Negotiating", bar: "w-3/4", color: "bg-indigo-500" },
                { name: "Priya Patel", budget: "$900K", status: "New Lead", bar: "w-1/3", color: "bg-slate-400" },
              ].map((lead) => (
                <div key={lead.name} className="bg-white rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{lead.name}</div>
                      <div className="text-xs text-slate-400">Budget: {lead.budget}</div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      {lead.status}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${lead.bar} ${lead.color} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white border border-slate-200 rounded-xl p-3 shadow-md flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                <GitFork size={12} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">AI Routed</div>
                <div className="text-[10px] text-slate-400">12 leads today</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: prefersReduced ? 0 : 0.2 + i * 0.07, ease: "easeOut" }}
              className="flex flex-col gap-3 p-5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Icon size={17} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          className="mt-12 text-center"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-150 shadow-sm text-base"
          >
            Book a Demo
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-150" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
