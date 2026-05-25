"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Globe, DollarSign, ShieldCheck, Scale, Layers } from "lucide-react";

const markets = [
  { code: "PK", name: "Pakistan",       currency: "PKR", flag: "🇵🇰", status: "Live" },
  { code: "AE", name: "UAE",            currency: "AED", flag: "🇦🇪", status: "Live" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", status: "Live" },
  { code: "US", name: "United States",  currency: "USD", flag: "🇺🇸", status: "Coming Soon" },
];

const capabilities = [
  {
    icon: DollarSign,
    title: "Multi-Currency",
    desc: "Every financial figure stored with its ISO currency code. Displayed in the organization's local currency — PKR, AED, GBP, USD — automatically.",
  },
  {
    icon: Scale,
    title: "Compliance Abstraction",
    desc: "Tax logic, KYC requirements, and legal frameworks are modular per market. Adding a new country is a configuration, not a rebuild.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-Tenant Isolation",
    desc: "Every organization's data is strictly isolated. An organization in Dubai never shares data with one in Karachi — by architecture, not by policy.",
  },
  {
    icon: Layers,
    title: "Localized AI Responses",
    desc: "AI responds in the organization's configured language. WhatsApp conversations adapt to the buyer's preferred language automatically.",
  },
];

export default function GlobalSection() {
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
          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <Globe size={13} />
            Global-First Architecture
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Built to Operate
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              in Any Market.
            </span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            RealTron AI is not a Pakistan product with global ambitions. It is a global AI
            infrastructure platform deployed in its initial markets — with every architectural
            decision made for international scale from day one.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: market cards */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Active Markets</p>
            <div className="grid grid-cols-2 gap-4">
              {markets.map(({ code, name, currency, flag, status }, i) => (
                <motion.div
                  key={code}
                  initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: prefersReduced ? 0 : i * 0.08, ease: "easeOut" }}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{flag}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      status === "Live"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{currency} · {code}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Architecture note:</span> Adding a new market requires configuring
                currency, tax rules, and compliance modules — not rebuilding the platform. Every data
                model is market-agnostic by design.
              </p>
            </div>
          </motion.div>

          {/* Right: capability cards */}
          <div className="flex flex-col gap-4">
            {capabilities.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={prefersReduced ? false : { opacity: 0, x: 24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.1 + i * 0.1, ease: "easeOut" }}
                className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
