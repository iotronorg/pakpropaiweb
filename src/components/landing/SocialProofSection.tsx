"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "We went from managing 400 leads on spreadsheets to a fully automated pipeline. Our agents now spend zero time on data entry — the AI handles qualification, follow-up, and routing. Conversion is up 38% in 90 days.",
    name: "David Harrington",
    title: "Head of Sales",
    company: "Harrington Realty Group",
    market: "United Kingdom",
    flag: "🇬🇧",
    rating: 5,
  },
  {
    quote:
      "The multi-currency and compliance support is what sold us. We operate across UAE, UK, and Pakistan — and RealTron AI treats each market correctly without us having to configure anything bespoke.",
    name: "Tariq Al-Mansoori",
    title: "CEO",
    company: "Al Mansoori Properties",
    market: "UAE",
    flag: "🇦🇪",
    rating: 5,
  },
  {
    quote:
      "Our buyers used to call agents directly and deals would fall through the cracks. Now the AI on WhatsApp handles every inquiry instantly, qualifies the buyer, and hands off to the right agent. Zero missed leads.",
    name: "Ayesha Farooq",
    title: "Director of Operations",
    company: "Skyline Developers",
    market: "Pakistan",
    flag: "🇵🇰",
    rating: 5,
  },
];

const logos = [
  "Enterprise Realty Co.",
  "Gulf Properties",
  "London Prime Homes",
  "Karachi Housing Corp",
  "Atlas Real Estate",
  "Crown Developers",
];

export default function SocialProofSection() {
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
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Trusted by Organizations Worldwide
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Real Results.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Real Organizations.
            </span>
          </h2>
        </motion.div>

        {/* Logo strip */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mb-16"
        >
          {logos.map((logo) => (
            <span
              key={logo}
              className="text-slate-300 text-sm font-bold uppercase tracking-widest"
            >
              {logo}
            </span>
          ))}
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, title, company, market, flag, rating }, i) => (
            <motion.div
              key={name}
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: prefersReduced ? 0 : 0.2 + i * 0.1, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <Quote size={20} className="text-blue-200" />
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed flex-1">{quote}</p>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-base shrink-0">
                  {flag}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{name}</div>
                  <div className="text-xs text-slate-400">{title}, {company}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{market}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
