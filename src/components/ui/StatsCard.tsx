"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CardColor = "green" | "blue" | "yellow" | "red" | "gray" | "purple" | "teal";

interface StatsCardProps {
  label:  string;
  value:  string | number;
  sub?:   string;
  color?: CardColor;
  icon?:  LucideIcon;
  trend?: "up" | "down" | "flat";
  index?: number;
}

const colorMap: Record<CardColor, { value: string; icon: string; badge: string; bar: string }> = {
  blue:   { value: "text-sky-600",     icon: "bg-sky-50 text-sky-600 border-sky-200",        badge: "bg-sky-50 text-sky-600",     bar: "bg-sky-500" },
  green:  { value: "text-emerald-600", icon: "bg-emerald-50 text-emerald-600 border-emerald-200", badge: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  yellow: { value: "text-amber-600",   icon: "bg-amber-50 text-amber-600 border-amber-200",  badge: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  red:    { value: "text-red-600",     icon: "bg-red-50 text-red-600 border-red-200",        badge: "bg-red-50 text-red-600",     bar: "bg-red-500" },
  gray:   { value: "text-slate-600",   icon: "bg-slate-50 text-slate-500 border-slate-200",  badge: "bg-slate-50 text-slate-600", bar: "bg-slate-400" },
  purple: { value: "text-violet-600",  icon: "bg-violet-50 text-violet-600 border-violet-200", badge: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  teal:   { value: "text-teal-600",    icon: "bg-teal-50 text-teal-600 border-teal-200",    badge: "bg-teal-50 text-teal-600",   bar: "bg-teal-500" },
};

export function StatsCard({ label, value, sub, color = "gray", icon: Icon, trend, index = 0 }: StatsCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm cursor-default"
    >
      {/* Colored top bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${c.bar} opacity-60`} />

      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`rounded-lg border p-1.5 ${c.icon}`}>
            <Icon size={13} />
          </div>
        )}
      </div>

      <p className={`mt-3 text-3xl font-bold tabular-nums ${c.value}`}>{value}</p>

      <div className="mt-2 flex items-center gap-2">
        {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
        {trend === "up"   && <TrendingUp   size={11} className="text-emerald-500 shrink-0" />}
        {trend === "down" && <TrendingDown  size={11} className="text-red-500 shrink-0" />}
        {trend === "flat" && <Minus        size={11} className="text-slate-400 shrink-0" />}
      </div>
    </motion.div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
      <div className="shimmer h-3 w-24 rounded-md" />
      <div className="shimmer mt-4 h-8 w-16 rounded-md" />
      <div className="shimmer mt-2 h-2.5 w-20 rounded-md" />
    </div>
  );
}
