"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CheckCircle2, MessageCircle, Mic, Image, FileText } from "lucide-react";

const conversation = [
  { from: "user", text: "2 bedroom apartment in Dubai Marina under 1.5M AED, sea view preferred" },
  { from: "ai", text: "Found 9 verified properties matching your criteria. Here are the top 3:" },
  { from: "ai", isCard: true, title: "Marina View Tower — 2BR", detail: "1.42M AED · 1,250 sqft · Sea view · Vacant", score: 94 },
  { from: "user", text: "Check this listing for me [screenshot]" },
  { from: "ai", text: "✅ Verification Complete — Risk Score: 2/10 (Low Risk)\nOwnership verified. No tampering detected. Trust certificate ready." },
  { from: "user", text: "Connect me to an agent for this property" },
  { from: "ai", text: "Matching you with James Miller — KYC-verified, 4.9★, Marina specialist. He'll be with you on WhatsApp in minutes." },
];

const inputModes = [
  { icon: MessageCircle, label: "Text", desc: "Any language, any format" },
  { icon: Mic, label: "Voice Notes", desc: "AI transcribes & understands" },
  { icon: Image, label: "Screenshots", desc: "Paste any listing image" },
  { icon: FileText, label: "Documents", desc: "Upload for verification" },
];

export default function WhatsAppSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section id="whatsapp" ref={ref} className="bg-white py-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: -32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/25 text-[#128C7E] rounded-full px-4 py-1.5 text-xs font-bold tracking-wide mb-5">
            <svg viewBox="0 0 24 24" fill="#25D366" className="w-3.5 h-3.5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            WhatsApp-First Platform
          </span>

          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-5"
            style={{ fontFamily: "var(--font-cinzel, 'Georgia', serif)" }}
          >
            Your Clients Already
            <br />
            <span className="text-[#25D366]">Live on WhatsApp.</span>
          </h2>

          <p className="text-lg text-slate-500 leading-relaxed mb-8">
            No app to download. No onboarding friction. Your AI sales agent runs 24/7 on
            WhatsApp — qualifying buyers, surfacing properties, running scam checks, and
            routing hot leads directly to your agents.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {inputModes.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#25D366]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {["No app download required", "Works on any device", "AI available 24/7"].map((p) => (
              <div key={p} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                {p}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: WhatsApp UI mock */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: 32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="relative"
        >
          {/* Phone frame */}
          <div className="relative mx-auto w-80 bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
            <div className="bg-white rounded-[2rem] overflow-hidden">
              {/* WA Header */}
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">RealTron AI</div>
                  <div className="text-emerald-300 text-xs">● Online</div>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-[#ECE5DD] px-3 py-4 space-y-2 max-h-96 overflow-y-auto">
                {conversation.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3, delay: prefersReduced ? 0 : i * 0.08 }}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.isCard ? (
                      <div className="bg-white rounded-xl p-3 shadow-sm max-w-[75%] border border-gray-100">
                        <div className="text-xs font-bold text-gray-800 mb-1">{msg.title}</div>
                        <div className="text-[10px] text-slate-500">{msg.detail}</div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            AI Score: {msg.score}/100
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl text-xs shadow-sm whitespace-pre-line ${
                          msg.from === "user"
                            ? "bg-[#DCF8C6] text-gray-800 rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Input bar */}
              <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs text-gray-400">
                  Message...
                </div>
                <div className="w-7 h-7 bg-[#25D366] rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
