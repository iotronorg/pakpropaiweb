"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ShieldAlert, FileCheck2, BarChart3, UserCheck, LockKeyhole } from "lucide-react";

const features = [
  {
    icon: ShieldAlert,
    title: "Scam Check",
    tag: "Core Feature",
    description:
      "Paste any listing link, upload a screenshot, or describe a property. Get an AI-generated risk score, red flags, and recommendation in under 30 seconds.",
    bullets: ["Link / screenshot / voice", "Risk score 1–10", "Instant red flag report"],
    color: "#EF4444",
    tagBg: "bg-red-50",
    tagText: "text-red-600",
    tagBorder: "border-red-100",
    iconBg: "bg-red-50",
    iconBorder: "border-red-100",
  },
  {
    icon: FileCheck2,
    title: "Property Verification",
    tag: "Trust Engine",
    description:
      "Upload ownership documents. OCR + AI validates title clarity, detects tampering, cross-checks records, and issues a shareable trust certificate.",
    bullets: ["OCR document analysis", "Ownership cross-check", "Trust certificate PDF"],
    color: "#059669",
    tagBg: "bg-emerald-50",
    tagText: "text-emerald-700",
    tagBorder: "border-emerald-100",
    iconBg: "bg-emerald-50",
    iconBorder: "border-emerald-100",
  },
  {
    icon: BarChart3,
    title: "AI Decision Engine",
    tag: "Intelligence",
    description:
      "Risk score, investment grade, 7E tax, CGT, Apna Ghar eligibility, infrastructure growth prediction — all in one WhatsApp report.",
    bullets: ["Risk + investment grade", "Tax & loan engine", "5-year growth forecast"],
    color: "#7C3AED",
    tagBg: "bg-violet-50",
    tagText: "text-violet-700",
    tagBorder: "border-violet-100",
    iconBg: "bg-violet-50",
    iconBorder: "border-violet-100",
  },
  {
    icon: UserCheck,
    title: "Verified Agent Network",
    tag: "Trust Layer",
    description:
      "KYC-verified, rated agents matched to your budget and intent. AI qualifies leads before connecting — no cold calls, no time wasters.",
    bullets: ["KYC-verified agents", "AI lead qualification", "WhatsApp connection"],
    color: "#0891B2",
    tagBg: "bg-sky-50",
    tagText: "text-sky-700",
    tagBorder: "border-sky-100",
    iconBg: "bg-sky-50",
    iconBorder: "border-sky-100",
  },
  {
    icon: LockKeyhole,
    title: "Deal Lock & Escrow",
    tag: "Transaction",
    description:
      "PKR 25K–100K token in Safepay escrow. 48-hour exclusivity guaranteed. Both sides protected. PakProp never holds your money.",
    bullets: ["Safepay escrow", "48hr exclusivity", "Fully traceable"],
    color: "#D97706",
    tagBg: "bg-amber-50",
    tagText: "text-amber-700",
    tagBorder: "border-amber-100",
    iconBg: "bg-amber-50",
    iconBorder: "border-amber-100",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section id="features" ref={ref} className="bg-gray-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Platform Features
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Everything Built for Trust.
            <br />
            <span className="text-emerald-600">Nothing Built for Show.</span>
          </h2>
        </motion.div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, tag, description, bullets, color, tagBg, tagText, tagBorder, iconBg, iconBorder }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: prefersReduced ? 0 : i * 0.1, ease: "easeOut" }}
              whileHover={prefersReduced ? {} : { y: -3 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4 cursor-default"
            >
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl ${iconBg} border ${iconBorder} flex items-center justify-center`}>
                  <Icon size={20} style={{ color }} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tagBg} ${tagText} border ${tagBorder}`}>
                  {tag}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>

              <ul className="flex flex-col gap-1.5 mt-auto pt-4 border-t border-gray-50">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
