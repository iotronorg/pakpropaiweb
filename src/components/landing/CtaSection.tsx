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
    accentColor: "#2563EB",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-100",
    iconBg: "bg-blue-50",
    iconBorder: "border-blue-100",
    iconColor: "text-blue-600",
    ctaClass: "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200",
    topBorder: "border-t-blue-500",
  },
  {
    icon: Users,
    label: "For Sales Agents",
    heading: "Close More Deals with AI Assistance",
    body: "Join the verified agent network. Get AI-qualified leads, property recommendations, and WhatsApp automation tools that help you close faster.",
    cta: "Join as an Agent",
    href: "/register",
    accentColor: "#4F46E5",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    badgeBorder: "border-indigo-100",
    iconBg: "bg-indigo-50",
    iconBorder: "border-indigo-100",
    iconColor: "text-indigo-600",
    ctaClass: "bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200",
    topBorder: "border-t-indigo-500",
  },
  {
    icon: MessageCircle,
    label: "For Buyers & Investors",
    heading: "Find, Verify & Transact on WhatsApp",
    body: "Search verified properties, run scam checks, get investment analysis, and connect with KYC-verified agents — all on WhatsApp with no app needed.",
    cta: "Try on WhatsApp",
    href: "https://wa.me/923000000000",
    accentColor: "#25D366",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-100",
    iconBg: "bg-emerald-50",
    iconBorder: "border-emerald-100",
    iconColor: "text-emerald-600",
    ctaClass: "bg-[#25D366] hover:bg-[#1ea85a] shadow-sm shadow-emerald-200",
    topBorder: "border-t-emerald-500",
  },
];

export default function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} className="bg-slate-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Get Started Today
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Your Sales Operations?
            </span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            Choose how you want to get started.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {tracks.map(({ icon: Icon, label, heading, body, cta, href, badgeBg, badgeText, badgeBorder, iconBg, iconBorder, iconColor, ctaClass, topBorder }, i) => (
            <motion.div
              key={label}
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: prefersReduced ? 0 : i * 0.1, ease: "easeOut" }}
              className={`bg-white border-t-2 ${topBorder} border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-8 flex flex-col gap-5 transition-all duration-200`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl ${iconBg} border ${iconBorder} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <span className={`inline-block ${badgeBg} ${badgeText} border ${badgeBorder} text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mt-1`}>
                  {label}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug">{heading}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
              {href.startsWith("http") ? (
                <a
                  href={href}
                  className={`group inline-flex items-center justify-center gap-2 ${ctaClass} text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 text-sm cursor-pointer`}
                >
                  {cta}
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-150" />
                </a>
              ) : (
                <Link
                  href={href}
                  className={`group inline-flex items-center justify-center gap-2 ${ctaClass} text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 text-sm cursor-pointer`}
                >
                  {cta}
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-150" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-slate-400 mt-8"
        >
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Sign in to your dashboard →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
