"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Building2, Users, MessageCircle } from "lucide-react";

const tracks = [
  {
    icon: Building2,
    label: "For Organizations",
    heading: "Scale Your Sales Team with AI",
    body: "Get full CRM, AI lead qualification, agent management, WhatsApp automation, and analytics — built for real estate developers and agencies.",
    cta: "Register Your Organization",
    href: "/register",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    ctaClass: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/40",
  },
  {
    icon: Users,
    label: "For Sales Agents",
    heading: "Close More Deals with AI Assistance",
    body: "Join the verified agent network. Get AI-qualified leads, property recommendations, and WhatsApp automation tools that help you close faster.",
    cta: "Join as an Agent",
    href: "/register",
    accent: "from-violet-500/20 to-sky-500/10",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    ctaClass: "bg-violet-600 hover:bg-violet-700 shadow-violet-900/40",
  },
  {
    icon: MessageCircle,
    label: "For Buyers & Investors",
    heading: "Find, Verify & Transact on WhatsApp",
    body: "Search verified properties, run scam checks, get investment analysis, and connect with KYC-verified agents — all on WhatsApp with no app needed.",
    cta: "Try on WhatsApp",
    href: "https://wa.me/923000000000",
    accent: "from-[#25D366]/15 to-emerald-900/10",
    border: "border-[#25D366]/20",
    iconBg: "bg-[#25D366]/20",
    iconColor: "text-[#25D366]",
    ctaClass: "bg-[#25D366] hover:bg-[#1ea85a] shadow-green-900/40",
  },
];

export default function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} className="bg-gray-950 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Your Sales Operations?
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Choose how you want to get started.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {tracks.map(({ icon: Icon, label, heading, body, cta, href, accent, border, iconBg, iconColor, ctaClass }, i) => (
            <motion.div
              key={label}
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: prefersReduced ? 0 : i * 0.1, ease: "easeOut" }}
              className={`bg-gradient-to-br ${accent} border ${border} rounded-2xl p-8 flex flex-col gap-5`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon size={22} className={iconColor} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</div>
                <h3 className="text-xl font-bold text-white mb-3 leading-snug">{heading}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
              {href.startsWith("http") ? (
                <a
                  href={href}
                  className={`group inline-flex items-center justify-center gap-2 ${ctaClass} text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 shadow-lg text-sm`}
                >
                  {cta}
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-150" />
                </a>
              ) : (
                <Link
                  href={href}
                  className={`group inline-flex items-center justify-center gap-2 ${ctaClass} text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 shadow-lg text-sm`}
                >
                  {cta}
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-150" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Sign in link */}
        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in to your dashboard →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
