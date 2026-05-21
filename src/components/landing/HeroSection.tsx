"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, TrendingUp, Users, Zap } from "lucide-react";

const metrics = [
  { icon: Users, value: "500+", label: "Organizations", color: "text-blue-600" },
  { icon: TrendingUp, value: "2.4M+", label: "Leads Qualified", color: "text-indigo-600" },
  { icon: Zap, value: "89%", label: "Faster Response", color: "text-sky-600" },
];

const pillars = [
  "AI Lead Qualification",
  "WhatsApp Automation",
  "CRM Intelligence",
];

function DashboardPreview({ dur }: { dur: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: dur + 0.1, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full max-w-2xl mx-auto mt-14"
    >
      {/* Subtle glow */}
      <div className="absolute -inset-4 bg-gradient-to-b from-blue-100/40 to-slate-100/20 rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Window chrome */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-300" />
            <div className="w-3 h-3 rounded-full bg-slate-300" />
            <div className="w-3 h-3 rounded-full bg-slate-300" />
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 mx-3 text-xs text-slate-400 text-center">
            app.realtron.ai / organization / dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 bg-white">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "Active Leads", val: "284", delta: "+12%", c: "text-blue-600", bg: "bg-blue-50" },
              { label: "Hot Leads", val: "41", delta: "+8%", c: "text-amber-600", bg: "bg-amber-50" },
              { label: "Deals Closing", val: "17", delta: "+23%", c: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "AI Qualified", val: "189", delta: "+31%", c: "text-sky-600", bg: "bg-sky-50" },
            ].map((k) => (
              <div key={k.label} className={`${k.bg} rounded-xl p-3 border border-slate-100`}>
                <div className="text-[10px] text-slate-500 font-medium mb-1">{k.label}</div>
                <div className="text-lg font-extrabold text-slate-900">{k.val}</div>
                <div className={`text-[10px] font-semibold ${k.c}`}>{k.delta} this week</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <div className="text-xs font-bold text-slate-600 mb-2 flex items-center justify-between">
                <span>Live Pipeline</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">● AI Active</span>
              </div>
              {[
                { name: "Imran Siddiqui", budget: "2.8 Cr", pct: "w-5/6", sc: "bg-blue-600" },
                { name: "Hina Tariq", budget: "95 Lac", pct: "w-3/5", sc: "bg-sky-500" },
                { name: "Rashid Enterprises", budget: "12 Cr", pct: "w-3/4", sc: "bg-indigo-500" },
              ].map((l) => (
                <div key={l.name} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {l.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{l.name}</div>
                    <div className="h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full ${l.pct} ${l.sc} rounded-full`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{l.budget}</span>
                </div>
              ))}
            </div>

            <div className="w-40 shrink-0">
              <div className="text-xs font-bold text-slate-600 mb-2">AI Activity</div>
              <div className="space-y-1.5">
                {[
                  { msg: "Lead qualified → agent A", t: "2s ago", c: "text-blue-600" },
                  { msg: "Follow-up sent to 3 leads", t: "1m ago", c: "text-sky-600" },
                  { msg: "Scam check completed", t: "4m ago", c: "text-indigo-600" },
                  { msg: "New WhatsApp inquiry", t: "6m ago", c: "text-slate-600" },
                ].map((a, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <div className={`text-[9px] font-semibold ${a.c}`}>{a.msg}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{a.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="absolute -bottom-4 -left-4 bg-white border border-slate-200 rounded-xl p-2.5 shadow-lg flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
          <Zap size={12} className="text-blue-600" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-800">AI Routed</div>
          <div className="text-[9px] text-slate-400">34 leads today</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HeroSection() {
  const prefersReduced = useReducedMotion();
  const dur = prefersReduced ? 0 : 0.55;
  const y = prefersReduced ? 0 : 24;

  return (
    <section className="relative bg-white overflow-hidden pt-28 pb-16 px-6">
      {/* Subtle background — no aurora, just a clean gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-blue-50/60 via-slate-50/40 to-indigo-50/30 rounded-full blur-3xl" />
      </div>
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px)`, backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur, ease: "easeOut" }}>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-5 py-2 text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Enterprise AI Platform for Real Estate
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl lg:text-[4.75rem] font-extrabold text-slate-900 leading-[1.08] tracking-tight"
          style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
        >
          AI Sales Infrastructure
          <br />
          <span className="relative">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              for Real Estate.
            </span>
            <motion.span
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.7, delay: prefersReduced ? 0 : 0.75 }}
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"
            />
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
          className="text-xl text-slate-500 max-w-2xl leading-relaxed font-normal"
        >
          Built for developers, agencies, and brokerages. AI qualifies every lead, automates
          follow-ups, routes buyers on WhatsApp, and gives your team complete pipeline visibility.
        </motion.p>

        {/* Pillars */}
        <motion.div
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.3, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {pillars.map((pt) => (
            <div key={pt} className="flex items-center gap-1.5 text-sm text-slate-500">
              <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
              {pt}
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 mt-2"
        >
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] text-base"
          >
            Get Started Free
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-150" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:bg-blue-50 text-base"
          >
            See How It Works
          </a>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.5, ease: "easeOut" }}
          className="mt-4 grid grid-cols-3 gap-8 border-t border-slate-100 pt-8 w-full max-w-lg"
        >
          {metrics.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="text-center flex flex-col items-center gap-2">
              <Icon size={16} className={color} />
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </motion.div>

        <DashboardPreview dur={dur} />
      </div>
    </section>
  );
}
