"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Trial",
    badge: null,
    description: "Get your first pipeline live in 24 hours. No payment required.",
    highlight: false,
    features: [
      "Up to 3 agents",
      "100 AI-qualified leads / month",
      "WhatsApp automation (limited)",
      "Basic analytics",
      "Community support",
    ],
    cta: "Start Free Trial",
    href: "/register/organization",
    ctaVariant: "outline",
  },
  {
    name: "Growth",
    badge: "Most Popular",
    description: "Full AI pipeline for growing sales teams — no limits on inventory.",
    highlight: true,
    features: [
      "Unlimited agents",
      "Unlimited AI-qualified leads",
      "Full WhatsApp automation",
      "Deal Lock & Escrow",
      "Advanced analytics + AI insights",
      "Priority support",
    ],
    cta: "Book a Demo",
    href: "/register/organization",
    ctaVariant: "primary",
  },
  {
    name: "Enterprise",
    badge: null,
    description: "Multi-market, multi-currency, custom compliance — built for scale.",
    highlight: false,
    features: [
      "Everything in Growth",
      "Multi-market + multi-currency",
      "Custom compliance modules",
      "Dedicated AI training on your inventory",
      "White-label options",
      "Dedicated account manager",
    ],
    cta: "Talk to Sales",
    href: "/register/organization",
    ctaVariant: "outline",
  },
];

export default function PricingTeaser() {
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
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <Zap size={12} />
            Pricing
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Simple Plans.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Enterprise-Grade Infrastructure.
            </span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            Start free. Scale as you grow. Every plan includes the full AI layer —
            WhatsApp automation, lead qualification, and deal orchestration.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, badge, description, highlight, features, cta, href, ctaVariant }, i) => (
            <motion.div
              key={name}
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: prefersReduced ? 0 : i * 0.1, ease: "easeOut" }}
              className={`relative rounded-2xl p-8 flex flex-col gap-6 border transition-all duration-200 ${
                highlight
                  ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {badge}
                  </span>
                </div>
              )}

              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${highlight ? "text-blue-200" : "text-slate-400"}`}>
                  {name}
                </div>
                <p className={`text-sm leading-relaxed ${highlight ? "text-blue-100" : "text-slate-500"}`}>
                  {description}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      highlight ? "bg-white/20" : "bg-blue-50 border border-blue-100"
                    }`}>
                      <Check size={9} className={highlight ? "text-white" : "text-blue-600"} strokeWidth={3} />
                    </div>
                    <span className={`text-sm ${highlight ? "text-blue-50" : "text-slate-600"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`group mt-auto inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 text-sm ${
                  ctaVariant === "primary"
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : highlight
                    ? "bg-transparent border border-white/30 text-white hover:bg-white/10"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                }`}
              >
                {cta}
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-150" />
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-slate-400 mt-8"
        >
          All plans include full AI capabilities. No per-seat fees for WhatsApp conversations.{" "}
          <Link href="/register/organization" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            See full pricing →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
