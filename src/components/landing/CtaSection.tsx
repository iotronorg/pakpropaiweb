"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, LogIn, MessageCircle, Phone } from "lucide-react";

const WHATSAPP_NUMBER = "923000000000";
const WHATSAPP_DISPLAY = "+92 300 0000000";

export default function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} className="bg-gray-950 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Already have account */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <LogIn size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Already a Member?</h3>
              <p className="text-gray-400 leading-relaxed">
                Sign in to access your dashboard, leads, listings, and AI tools.
              </p>
            </div>
            <Link
              href="/login"
              className="group mt-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-6 py-3.5 rounded-xl transition-colors duration-150"
            >
              Sign In to Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-150" />
            </Link>
          </motion.div>

          {/* WhatsApp contact */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="bg-gradient-to-br from-[#25D366]/20 to-emerald-900/20 border border-[#25D366]/30 rounded-2xl p-8 flex flex-col gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center">
              <MessageCircle size={22} className="text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Try the AI on WhatsApp</h3>
              <p className="text-gray-400 leading-relaxed">
                No sign-up needed. Message our AI right now — search properties, check listings,
                get tax advice, or ask anything about Pakistani real estate.
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ea85a] text-white font-semibold px-6 py-3.5 rounded-xl transition-colors duration-150"
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Chat on WhatsApp Now
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={13} className="text-gray-500" />
                <span>Or save the number: <span className="text-[#25D366] font-semibold">{WHATSAPP_DISPLAY}</span></span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
