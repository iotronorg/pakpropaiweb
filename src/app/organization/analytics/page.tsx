"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import {
  getLeadReport, getAgentReport, getPropertyReport, getDealReport,
  getFunnelAnalytics, getWaTokenUsage, getSpeedLeaderboard,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import {
  StatCard, ChartCard, BarChart, BreakdownBar,
  SectionHeader, type Period, type TrendPoint,
} from "@/components/ui/Charts";
import type {
  AgentPerformanceRow, LeadReportData, PropertyReportData, DealReportData,
  FunnelData, WaTokenData, SpeedLeaderboardEntry,
} from "@/types";

// ── animation variants ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ── Funnel component ────────────────────────────────────────────────────────

function SalesFunnel({ data }: { data: FunnelData }) {
  const max = data.stages[0]?.count || 1;
  const colors = [
    "from-violet-500 to-violet-400",
    "from-blue-500 to-blue-400",
    "from-cyan-500 to-cyan-400",
    "from-teal-500 to-teal-400",
    "from-emerald-500 to-emerald-400",
    "from-green-500 to-green-400",
  ];
  return (
    <div className="space-y-2">
      {data.stages.map((s, i) => {
        const width = max > 0 ? Math.max((s.count / max) * 100, 4) : 4;
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <span className="w-20 text-right text-xs font-medium text-gray-500 shrink-0">
              {s.stage}
            </span>
            <div className="flex-1 h-8 rounded-full bg-gray-100 overflow-hidden relative">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${colors[i]}`}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-2 w-28 shrink-0">
              <span className="text-sm font-bold text-gray-800 tabular-nums">
                {s.count.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">
                {s.conversion.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>Overall conversion</span>
        <span className="font-semibold text-emerald-600">
          {data.overall_conversion.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ── WA Token bar chart ──────────────────────────────────────────────────────

function WaTokenChart({ data }: { data: WaTokenData }) {
  const max = Math.max(...data.monthly.map((m) => m.tokens), 1);
  return (
    <div className="space-y-2">
      {data.monthly.map((m, i) => {
        const pct = Math.max((m.tokens / max) * 100, m.tokens > 0 ? 2 : 0);
        return (
          <div key={m.period} className="flex items-center gap-3">
            <span className="w-16 text-right text-xs text-gray-400 shrink-0">
              {m.period.slice(5)}
            </span>
            <div className="flex-1 h-6 rounded bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded bg-gradient-to-r from-indigo-500 to-violet-400"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
              />
            </div>
            <span className="w-14 text-right text-xs font-medium text-gray-700 tabular-nums shrink-0">
              {m.tokens.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton helper ─────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function OrgAnalyticsPage() {
  const [leadPeriod, setLeadPeriod] = useState<Period>("weekly");
  const [propPeriod, setPropPeriod] = useState<Period>("monthly");

  const { data: leadData,  isLoading: l1 } = useQuery({
    queryKey: ["org-analytics-leads", leadPeriod],
    queryFn:  () => getLeadReport({ period: leadPeriod }).then((r) => r.data as LeadReportData),
  });
  const { data: agentData, isLoading: l2 } = useQuery({
    queryKey: ["org-analytics-agents"],
    queryFn:  () => getAgentReport().then((r) => r.data),
  });
  const { data: propData,  isLoading: l3 } = useQuery({
    queryKey: ["org-analytics-props", propPeriod],
    queryFn:  () => getPropertyReport({ period: propPeriod }).then((r) => r.data as PropertyReportData),
  });
  const { data: dealData, isLoading: l4 } = useQuery({
    queryKey: ["org-analytics-deals"],
    queryFn:  () => getDealReport().then((r) => r.data as DealReportData),
  });
  const { data: funnelData, isLoading: l5 } = useQuery({
    queryKey: ["org-analytics-funnel"],
    queryFn:  () => getFunnelAnalytics().then((r) => r.data),
  });
  const { data: waTokenData, isLoading: l6 } = useQuery({
    queryKey: ["org-analytics-wa-tokens"],
    queryFn:  () => getWaTokenUsage().then((r) => r.data),
  });
  const { data: leaderboardData, isLoading: l7 } = useQuery({
    queryKey: ["org-analytics-leaderboard"],
    queryFn:  () => getSpeedLeaderboard(10).then((r) => r.data),
  });

  const leads   = leadData  ?? { total: 0, avg_score: 0, hot_leads: 0, by_status: {}, by_intent: {}, by_source: {} };
  const agents  = ((agentData as { results?: AgentPerformanceRow[] })?.results ?? []);
  const props   = propData  ?? { total: 0, avg_ai_score: 0, installment_available: 0, by_type: {}, by_legal_status: {}, by_risk_level: {}, by_city: {} };
  const deals   = dealData  ?? { total_locks: 0, completed: 0, expired: 0, disputed: 0, avg_confirm_hours: null, by_status: {}, by_gateway: {} };

  const leadTrend: TrendPoint[] = leadData?.trend ?? [];
  const propTrend: TrendPoint[] = propData?.trend ?? [];

  const convRate = leads.total > 0
    ? Math.round(((leads.by_status?.qualified ?? 0) / leads.total) * 100)
    : 0;

  return (
    <div className="space-y-10 pb-12">

      {/* Page header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time multi-tenant BI — lead funnel, agent performance, WhatsApp AI usage
        </p>
      </motion.div>

      {/* ── 6-Stage Sales Funnel ─────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Sales Funnel" sub="Discover → Qualify → Verify → Connect → Negotiate → Transact" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Leads",       value: funnelData?.total_leads ?? 0,       accent: "blue"    as const, icon: "📋" },
              { label: "Overall Conv.",     value: `${funnelData?.overall_conversion ?? 0}%`, accent: "emerald" as const, icon: "📈" },
              { label: "Deals Transacted",  value: funnelData?.stages[5]?.count ?? 0,  accent: "violet"  as const, icon: "🔒" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp}>
                <StatCard {...s} />
              </motion.div>
            ))}
          </motion.div>
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Funnel Breakdown</h3>
            {l5 ? <SectionSkeleton rows={6} /> : funnelData
              ? <SalesFunnel data={funnelData} />
              : <p className="text-xs text-gray-400 text-center py-6">No data</p>}
          </div>
        </div>
      </section>

      {/* ── Lead KPIs ───────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Lead Analytics" sub="All leads scoped to your organization" />
        {l1 ? <SectionSkeleton rows={2} /> : (
          <motion.div variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Leads", value: leads.total,     accent: "blue"    as const, icon: "📋" },
              { label: "Hot Leads",   value: leads.hot_leads, accent: "amber"   as const, icon: "🔥", sub: "Score ≥ 70" },
              { label: "Avg Score",   value: leads.avg_score, accent: "violet"  as const, icon: "📊" },
              { label: "Conversion",  value: `${convRate}%`,  accent: "emerald" as const, icon: "✅", sub: "→ Qualified" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp}><StatCard {...s} /></motion.div>
            ))}
          </motion.div>
        )}
        {!l1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            {leadTrend.length > 0 && (
              <ChartCard title="Lead Volume" period={leadPeriod} onPeriodChange={setLeadPeriod}>
                <BarChart data={leadTrend} period={leadPeriod} color="blue" height={28} />
              </ChartCard>
            )}
            <div className="grid grid-cols-1 gap-5">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">By Intent</h3>
                {Object.keys(leads.by_intent).length > 0
                  ? <BreakdownBar data={leads.by_intent} />
                  : <p className="text-xs text-gray-400 text-center py-3">No data</p>}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">By Source</h3>
                {Object.keys(leads.by_source).length > 0
                  ? <BreakdownBar data={leads.by_source} />
                  : <p className="text-xs text-gray-400 text-center py-3">No data</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── WhatsApp AI Token Usage ──────────────────────────────────────── */}
      <section>
        <SectionHeader title="WhatsApp AI Token Usage" sub="Cumulative AI conversation turns over 6 months" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-3 gap-3">
            {[
              { label: "This Month", value: waTokenData?.current_month ?? 0,  accent: "violet" as const, icon: "💬" },
              { label: "6-Month Total", value: waTokenData?.total_6m ?? 0,    accent: "blue"   as const, icon: "📊" },
              { label: "Period", value: waTokenData?.current_period ?? "—",   accent: "amber"  as const, icon: "📅" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp}><StatCard {...s} /></motion.div>
            ))}
          </motion.div>
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Token Consumption</h3>
            {l6 ? <SectionSkeleton rows={6} /> : waTokenData
              ? <WaTokenChart data={waTokenData} />
              : <p className="text-xs text-gray-400 text-center py-6">No data</p>}
          </div>
        </div>
      </section>

      {/* ── Agent Speed Leaderboard ──────────────────────────────────────── */}
      <section>
        <SectionHeader title="Agent Speed Leaderboard" sub="Ranked by fastest lead response time (Redis sorted set, 24 h window)" />
        {l7 ? <SectionSkeleton rows={5} /> : leaderboardData && leaderboardData.length > 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["#", "Agent", "Avg Response", "Closed Deals", "Rating"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody className="divide-y divide-gray-50"
                variants={stagger} initial="hidden" animate="visible">
                {(leaderboardData as SpeedLeaderboardEntry[]).map((e) => (
                  <motion.tr key={e.agent_id} variants={fadeUp}
                    className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 w-12">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                        ${e.rank === 1 ? "bg-amber-100 text-amber-600" :
                          e.rank === 2 ? "bg-slate-100 text-slate-500" :
                          e.rank === 3 ? "bg-orange-100 text-orange-500" : "text-gray-400"}`}>
                        {e.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-violet-600">
                            {e.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {e.avg_response_time_hours !== null
                        ? <span className="font-medium text-teal-600">{e.avg_response_time_hours.toFixed(1)}h</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-gray-700">{e.closed_deals}</td>
                    <td className="px-5 py-3">
                      {e.rating > 0
                        ? <span className="font-medium">⭐ {e.rating.toFixed(1)}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        ) : <p className="text-xs text-gray-400 text-center py-6">No agents yet</p>}
      </section>

      {/* ── Inventory Analytics ──────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Inventory Analytics" sub="Active listings in your organization" />
        {l3 ? <SectionSkeleton /> : (
          <>
            <motion.div variants={stagger} initial="hidden" animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Total Listings",    value: props.total,                             accent: "blue"    as const, icon: "🏠" },
                { label: "Verified",          value: props.by_legal_status?.verified ?? 0,    accent: "emerald" as const, icon: "✅" },
                { label: "Installment Plans", value: props.installment_available,             accent: "violet"  as const, icon: "📅" },
                { label: "Avg AI Score",      value: `${props.avg_ai_score}/100`,             accent: "amber"   as const, icon: "🤖" },
              ].map((s) => (
                <motion.div key={s.label} variants={fadeUp}><StatCard {...s} /></motion.div>
              ))}
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {propTrend.length > 0 && (
                <div className="lg:col-span-2">
                  <ChartCard title="Inventory Growth" period={propPeriod} onPeriodChange={setPropPeriod}>
                    <BarChart data={propTrend} period={propPeriod} color="emerald" height={28} />
                  </ChartCard>
                </div>
              )}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">By Type</h3>
                {Object.keys(props.by_type).length > 0
                  ? <BreakdownBar data={props.by_type} />
                  : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Deal Analytics ───────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Deal Analytics" sub="Deal lock activity for your organization" />
        {l4 ? <SectionSkeleton /> : (
          <motion.div variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Locks",      value: deals.total_locks,    accent: "blue"    as const, icon: "🔒" },
              { label: "Completed",        value: deals.completed,      accent: "emerald" as const, icon: "✅", sub: "Released" },
              { label: "Disputed",         value: deals.disputed,       accent: "rose"    as const, icon: "⚠️" },
              { label: "Avg Confirm Time", value: deals.avg_confirm_hours !== null ? `${deals.avg_confirm_hours}h` : "—",
                accent: "violet" as const, icon: "⏱", sub: "Initiation → payment" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp}><StatCard {...s} /></motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Agent Performance Table ──────────────────────────────────────── */}
      {!l2 && agents.length > 0 && (
        <section>
          <SectionHeader title="Agent Performance" sub="All active agents in your organization" />
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Rank", "Agent", "City", "Leads", "Qualified", "Closed Deals", "Rating", "Verified"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody className="divide-y divide-gray-50"
                variants={stagger} initial="hidden" animate="visible">
                {agents.map((a, i) => (
                  <motion.tr key={a.id} variants={fadeUp}
                    className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs font-bold text-gray-400 tabular-nums">#{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-violet-600">
                            {a.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{a.primary_city || "—"}</td>
                    <td className="px-5 py-3 font-bold text-gray-900 tabular-nums">{a.total_leads}</td>
                    <td className="px-5 py-3 text-gray-600 tabular-nums">{a.closed_leads}</td>
                    <td className="px-5 py-3 text-gray-600 tabular-nums">{a.closed_deals}</td>
                    <td className="px-5 py-3">
                      {a.rating > 0
                        ? <span className="font-medium">⭐ {a.rating.toFixed(1)}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge label={a.is_verified ? "Yes" : "No"} variant={a.is_verified ? "green" : "gray"} />
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
