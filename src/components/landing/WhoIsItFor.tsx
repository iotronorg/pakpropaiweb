"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { MessageCircle, LayoutDashboard, Building } from "lucide-react";

const personas = [
  {
    icon: MessageCircle,
    title: "Buyers & Sellers",
    subtitle: "WhatsApp-first experience",
    color: "#25D366",
    bgColor: "#25D366",
    description:
      "Search properties, verify listings, get AI-powered advice, connect with trusted agents, and lock deals — all from WhatsApp. No app download. No account needed to start.",
    capabilities: [
      "Natural language property search",
      "Scam check any listing in 30s",
      "Tax & loan eligibility calculator",
      "Deal lock with escrow protection",
    ],
  },
  {
    icon: LayoutDashboard,
    title: "Real Estate Agents",
    subtitle: "Dashboard + WhatsApp CRM",
    color: "#0F766E",
    bgColor: "#0F766E",
    description:
      "Manage your listings, handle AI-qualified leads, access WhatsApp CRM conversations, and track performance — from a purpose-built agent dashboard. No cold leads, no wasted follow-ups.",
    capabilities: [
      "AI-qualified lead pipeline",
      "WhatsApp CRM integration",
      "Listing & verification management",
      "Performance analytics",
    ],
  },
  {
    icon: Building,
    title: "Developers & Agencies",
    subtitle: "Organisation-level SaaS",
    color: "#7C3AED",
    bgColor: "#7C3AED",
    description:
      "Manage entire sales teams, track org-wide leads and inventory, run analytics dashboards, and assign leads intelligently — all with strict data isolation between organisations.",
    capabilities: [
      "Org-wide lead visibility",
      "Team management & routing",
      "Inventory at scale",
      "Sales funnel analytics",
    ],
  },
];

export default function WhoIsItFor() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} className="bg-[#0D1117] py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#14B8A6]">
            Who It&apos;s For
          </span>
          <h2
            className="mt-3 text-4xl sm:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Cinzel', 'Georgia', serif" }}
          >
            Built for Every Player
            <br />
            <span className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] bg-clip-text text-transparent">
              in the Market.
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {personas.map(({ icon: Icon, title, subtitle, color, bgColor, description, capabilities }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: prefersReduced ? 0 : i * 0.15, ease: "easeOut" }}
              className="relative rounded-2xl p-6 border border-white/8 bg-white/4 flex flex-col gap-5 overflow-hidden group hover:border-white/15 transition-colors duration-200"
            >
              {/* Subtle top glow on hover */}
              <div
                className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
              />

              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: bgColor + "20", border: `1px solid ${color}40` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed">{description}</p>

              <ul className="flex flex-col gap-2 mt-auto pt-4 border-t border-white/8">
                {capabilities.map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg
                      className="w-4 h-4 shrink-0"
                      style={{ color }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {cap}
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
