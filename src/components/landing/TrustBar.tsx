"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Building2, Users, ShieldCheck, TrendingUp } from "lucide-react";

const stats = [
  { icon: ShieldCheck, label: "Scam Checks Run", value: 12400, suffix: "+", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { icon: Building2, label: "Properties Verified", value: 3800, suffix: "+", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  { icon: Users, label: "Verified Agents", value: 620, suffix: "+", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
  { icon: TrendingUp, label: "Deals Facilitated", value: 290, suffix: "+", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
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
    <section ref={ref} className="bg-gray-50 border-y border-gray-100 py-14 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ icon: Icon, label, value, suffix, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: prefersReduced ? 0 : i * 0.1, ease: "easeOut" }}
            className="flex flex-col items-center text-center gap-3"
          >
            <div className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div className={`text-3xl font-extrabold text-gray-900 tabular-nums`}>
              {inView ? <CountUp target={value} /> : "0"}
              <span className={color}>{suffix}</span>
            </div>
            <div className="text-xs text-gray-500 font-medium tracking-wide">{label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
