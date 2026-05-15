"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles, Star } from "lucide-react";

const proofPoints = [
  "No app download required",
  "Works on any WhatsApp",
  "AI available 24/7",
];

export default function HeroSection() {
  const prefersReduced = useReducedMotion();
  const dur = prefersReduced ? 0 : 0.55;
  const y = prefersReduced ? 0 : 24;

  return (
    <section className="relative bg-white overflow-hidden pt-24 pb-20 px-6">
      {/* Soft aurora background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-emerald-100/80 via-teal-50/60 to-sky-100/50 rounded-full blur-3xl" />
        <div className="absolute top-10 right-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50/60 rounded-full blur-2xl" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #059669 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
        {/* AI badge */}
        <motion.div
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide">
            <Sparkles size={12} className="text-emerald-500" />
            Pakistan&apos;s First AI Real Estate Assistant
            <Star size={10} className="fill-amber-400 text-amber-400" />
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight"
          style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
        >
          Find. Verify.{" "}
          <span className="relative">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Close Deals.
            </span>
            <motion.span
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.6, delay: prefersReduced ? 0 : 0.7 }}
              className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
            />
          </span>
          <br />
          <span className="text-gray-800">On WhatsApp.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
          className="text-xl text-gray-500 max-w-2xl leading-relaxed font-normal"
        >
          Pakistan&apos;s AI-powered property assistant verifies listings, detects scams, qualifies
          buyers, and helps agents close deals — all on WhatsApp, no app needed.
        </motion.p>

        {/* Social proof dots */}
        <motion.div
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.3, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {proofPoints.map((pt) => (
            <div key={pt} className="flex items-center gap-1.5 text-sm text-gray-500">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              {pt}
            </div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 mt-2"
        >
          <a
            href="#register"
            className="group inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] text-base"
          >
            Join as Agent — Free
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-150" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-emerald-50 text-base cursor-pointer"
          >
            See How It Works
          </a>
        </motion.div>

        {/* WhatsApp hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.55 }}
          className="flex items-center gap-2 mt-1"
        >
          <div className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/25 rounded-full px-4 py-2 text-sm text-gray-600">
            <MessageCircle size={15} className="text-[#25D366]" />
            <span>Chat with our AI on WhatsApp:</span>
            <a
              href="https://wa.me/923000000000"
              className="font-bold text-[#25D366] hover:underline"
            >
              +92 300 0000000
            </a>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: prefersReduced ? 0 : 0.6, ease: "easeOut" }}
          className="mt-6 grid grid-cols-3 gap-8 border-t border-gray-100 pt-8 w-full max-w-lg"
        >
          {[
            { value: "12,400+", label: "Scam Checks" },
            { value: "3,800+", label: "Verified Properties" },
            { value: "620+", label: "Verified Agents" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
