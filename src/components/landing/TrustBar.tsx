"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Building2, Users, TrendingUp, Zap, ShieldCheck } from "lucide-react";

const stats = [
  { icon: Building2, label: "Organizations Onboarded", value: 500, suffix: "+", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { icon: Users, label: "Leads Qualified by AI", value: 2400, suffix: "K+", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { icon: ShieldCheck, label: "Properties Verified", value: 38000, suffix: "+", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
  { icon: Zap, label: "AI Actions / Day", value: 14000, suffix: "+", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  { icon: TrendingUp, label: "Deals Closed", value: 1200, suffix: "+", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
];

function CountUp({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) { setCount(target); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, prefersReduced]);

  return <>{count.toLocaleString()}</>;
}

export default function TrustBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <section ref={ref} className="bg-slate-50 border-y border-slate-100 py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-10"
        >
          Trusted by Real Estate Organizations Across the Region
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {stats.map(({ icon: Icon, label, value, suffix, color, bg, border }, i) => (
            <motion.div
              key={label}
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: prefersReduced ? 0 : i * 0.08, ease: "easeOut" }}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {inView ? <CountUp target={value} /> : "0"}
                <span className={color}>{suffix}</span>
              </div>
              <div className="text-xs text-slate-500 font-medium leading-tight">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
