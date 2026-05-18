"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { AlertTriangle, Ghost, UserX } from "lucide-react";

const problems = [
  {
    icon: Ghost,
    title: "Ghost Listings Are Everywhere",
    stat: "40%",
    statLabel: "of listings are stale or fake",
    description:
      "You find the perfect property, contact the seller, and discover it was sold months ago — or never existed. Time wasted. Trust broken.",
    fix: "RealTron AI cross-checks every listing for freshness, duplicates, and ownership validity before you spend a single rupee.",
    color: "#EF4444",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    icon: AlertTriangle,
    title: "Scams Cost Billions Every Year",
    stat: "₨ Billions",
    statLabel: "lost to property fraud annually",
    description:
      "Paid token money on a plot with no legal title. Transferred funds to an agent who disappeared. These are not rare stories — they happen every day.",
    fix: "Our AI scam engine checks any listing in 30 seconds. Submit a link, screenshot, or voice note — get a risk score instantly.",
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: UserX,
    title: "No Way to Verify Your Agent",
    stat: "0",
    statLabel: "centralized agent verification system in Pakistan",
    description:
      "Anyone can call themselves a property agent. No KYC. No rating. No accountability. You're trusting a stranger with your life savings.",
    fix: "Every RealTron agent is KYC-verified, rated by buyers, and accountable through our platform. Verified badge = proven track record.",
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
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Pakistani Real Estate Has
            <br />
            <span className="text-red-500">a Trust Crisis.</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Scams, fake listings, and unverified agents cost buyers, sellers, and agents
            billions every year. It doesn&apos;t have to be this way.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-7">
          {problems.map(({ icon: Icon, title, stat, statLabel, description, fix, color, bg, border }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: prefersReduced ? 0 : i * 0.15, ease: "easeOut" }}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              {/* Stat header */}
              <div className={`${bg} ${border} border-b px-6 py-5 flex items-center gap-4`}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + "20" }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-gray-900 leading-none">{stat}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{statLabel}</div>
                </div>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4 flex-1">
                <h3 className="text-base font-bold text-gray-900 leading-snug">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>

                {/* Fix */}
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                    <span className="text-emerald-500 font-bold">✓ </span>{fix}
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
