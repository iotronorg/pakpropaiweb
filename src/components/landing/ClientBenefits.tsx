"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { MessageCircle, ShieldAlert, Calculator, Search, FileCheck2, Lock } from "lucide-react";

const benefits = [
  {
    icon: Search,
    title: "Find Properties in Plain Language",
    description:
      "Message the AI in Urdu or English. 'Ghar chahiye Lahore mein 50 lakh tak' — it understands and searches for you. No filters, no forms, no app.",
  },
  {
    icon: ShieldAlert,
    title: "Scam Check Any Listing in 30 Seconds",
    description:
      "Share a link, screenshot, or address. Get an AI-generated risk score and red flags instantly — before you visit, before you pay anything.",
  },
  {
    icon: FileCheck2,
    title: "Verify Ownership Before You Invest",
    description:
      "AI reads legal documents, cross-references registry records, and checks title clarity. You get a plain-language report — not legal jargon.",
  },
  {
    icon: Calculator,
    title: "AI Tax & Loan Calculator",
    description:
      "Instantly calculate 7E tax, Capital Gains Tax, Apna Ghar loan eligibility, EMIs, and stamp duty — all personalised to your situation on WhatsApp.",
  },
  {
    icon: Lock,
    title: "Deal Lock & Escrow Protection",
    description:
      "Token money held in Safepay escrow — not by us, not by the agent. 48-hour exclusivity guaranteed. Your money is safe if the deal falls through.",
  },
  {
    icon: MessageCircle,
    title: "No App. No Account. Just WhatsApp.",
    description:
      "Everything works on your existing WhatsApp. AI is available 24/7, speaks Urdu and English, and never puts you on hold.",
  },
];

export default function ClientBenefits() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section id="clients" ref={ref} className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid lg:grid-cols-2 gap-12 items-center mb-16"
        >
          <div>
            <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              For Buyers, Sellers & Investors
            </span>
            <h2
              className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight"
              style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
            >
              Buy & Sell Property
              <br />
              <span className="text-emerald-600">Without the Fear.</span>
            </h2>
          </div>
          <div>
            <p className="text-xl text-gray-500 leading-relaxed">
              Pakistan&apos;s first AI property assistant is on WhatsApp — guiding you from first
              search to final deal, protecting you from scams, and making sure you never overpay.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={`https://wa.me/923000000000`}
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ea85a] text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150 shadow-sm text-sm"
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Try it Free on WhatsApp
              </a>
            </div>
          </div>
        </motion.div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.2 + i * 0.08, ease: "easeOut" }}
              className="group flex flex-col gap-4 p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-150">
                <Icon size={18} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
