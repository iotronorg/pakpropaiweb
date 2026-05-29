"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTokenUsageStats } from "@/hooks/useTokenBudget";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { getTokenUsageStats } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

const stagger = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: "spring" as const, stiffness: 260, damping: 20 },
  }),
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  index,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  index: number;
}) {
  const accentClasses: Record<string, string> = {
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
    amber: "border-l-amber-500",
    violet: "border-l-violet-500",
  };
  return (
    <motion.div
      custom={index}
      variants={stagger}
      initial="hidden"
      animate="show"
      className={`rounded-xl border border-gray-200 bg-white p-5 border-l-4 ${accent ? accentClasses[accent] ?? "" : ""}`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </motion.div>
  );
}

function StateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    ok: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    throttled: "bg-orange-100 text-orange-700",
    hard_limit: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[state] ?? "bg-gray-100 text-gray-600"}`}>
      {state.replace("_", " ")}
    </span>
  );
}

/** Horizontal bar — org spend visualisation */
function OrgSpendBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 1 : 0) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-20 shrink-0 text-right tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

// ── Budget limit config panel ──────────────────────────────────────────────────

const PLAN_KEYS = [
  { key: "token_limit_trial", label: "Trial", defaultVal: 50000 },
  { key: "token_limit_basic", label: "Basic", defaultVal: 200000 },
  { key: "token_limit_professional", label: "Professional", defaultVal: 1000000 },
  { key: "token_limit_enterprise", label: "Enterprise", defaultVal: 5000000 },
];

function BudgetLimitPanel() {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(PLAN_KEYS.map((p) => [p.key, String(p.defaultVal)]))
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production this would call a SystemConfig PATCH endpoint
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      {PLAN_KEYS.map((plan) => (
        <div key={plan.key} className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-32 shrink-0">{plan.label}</label>
          <input
            type="number"
            value={values[plan.key]}
            onChange={(e) => setValues((v) => ({ ...v, [plan.key]: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-xs text-gray-400">tokens / 24h</span>
        </div>
      ))}
      <button
        onClick={handleSave}
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        {saved ? "Saved ✓" : "Save limits"}
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CostGovernancePage() {
  const { stats, isLoading } = useTokenUsageStats();

  // Per-org spend — fetch org-level data for top 5 display
  // In full implementation this would be a dedicated endpoint; here we derive from stats
  const fmtUsd = (n: number) => `$${n.toFixed(4)}`;
  const fmtK = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const cacheHitRate = stats?.cache_hit_rate ?? 0;
  const estCost = stats?.estimated_usd_cost ?? 0;
  const estSavings = stats?.estimated_savings_usd ?? 0;
  const totalTokens = (stats?.total_tokens_in ?? 0) + (stats?.total_tokens_out ?? 0);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Cost Governance</h1>
        <AnimatePresence>
          {!isLoading && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700"
            >
              AI token budgeting
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Section 1 — KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <KpiCard
              label="Total Tokens (24h)"
              value={fmtK(totalTokens)}
              sub={`${fmtK(stats?.total_tokens_in ?? 0)} in · ${fmtK(stats?.total_tokens_out ?? 0)} out`}
              accent="blue"
              index={0}
            />
            <KpiCard
              label="Est. Infrastructure Cost"
              value={fmtUsd(estCost)}
              sub={`${stats?.total_calls ?? 0} LLM calls`}
              accent="amber"
              index={1}
            />
            <KpiCard
              label="Cache Hit Rate"
              value={`${cacheHitRate.toFixed(1)}%`}
              sub={`${stats?.cache_hits ?? 0} of ${stats?.total_calls ?? 0} requests served from cache`}
              accent="emerald"
              index={2}
            />
            <KpiCard
              label="Est. Savings from Cache"
              value={fmtUsd(estSavings)}
              sub="LLM cost avoided by semantic cache"
              accent="violet"
              index={3}
            />
          </>
        )}
      </div>

      {/* Section 2 — Per-org spend (placeholder bar chart) */}
      <div className="space-y-3">
        <motion.h2
          custom={4}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="text-lg font-semibold text-gray-800"
        >
          Per-Org Token Spend (24h)
        </motion.h2>
        <motion.div
          custom={5}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-gray-200 bg-white p-5 space-y-3"
        >
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : totalTokens === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No token data yet</p>
          ) : (
            /* In production, this data would come from a per-org aggregation endpoint */
            <OrgSpendBar label="Platform total" value={totalTokens} max={totalTokens} />
          )}
        </motion.div>
      </div>

      {/* Section 3 — Budget limit config */}
      <div className="space-y-3">
        <motion.h2
          custom={6}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="text-lg font-semibold text-gray-800"
        >
          Plan Token Limits
        </motion.h2>
        <motion.div
          custom={7}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <BudgetLimitPanel />
        </motion.div>
      </div>

      {/* Section 4 — Platform-wide stats table */}
      {!isLoading && stats && (
        <motion.div
          custom={8}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Metric", "Value"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: "Total LLM calls", value: stats.total_calls.toLocaleString() },
                { label: "Cache hits", value: stats.cache_hits.toLocaleString() },
                { label: "Cache hit rate", value: `${cacheHitRate.toFixed(2)}%` },
                { label: "Tokens in", value: stats.total_tokens_in.toLocaleString() },
                { label: "Tokens out", value: stats.total_tokens_out.toLocaleString() },
                { label: "Est. cost", value: fmtUsd(estCost) },
                { label: "Est. savings (cache)", value: fmtUsd(estSavings) },
              ].map(({ label, value }) => (
                <tr key={label} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-600">{label}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900 tabular-nums">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
