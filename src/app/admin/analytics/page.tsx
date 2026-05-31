"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLeadReport, getAgentReport, getPropertyReport,
  getRevenueReport, getBotReport,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import {
  StatCard, ChartCard, BarChart, BreakdownBar, LeadPipelineFunnel,
  SectionHeader, type Period, type TrendPoint,
} from "@/components/ui/Charts";
import { ClipboardList, Flame, User, Home, Lock, MessageSquare } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [leadPeriod, setLeadPeriod]     = useState<Period>("weekly");
  const [revPeriod,  setRevPeriod]      = useState<Period>("monthly");
  const [botPeriod,  setBotPeriod]      = useState<Period>("weekly");
  const [propPeriod, setPropPeriod]     = useState<Period>("monthly");

  const { data: leadData,  isLoading: l1 } = useQuery({
    queryKey: ["analytics-leads", leadPeriod],
    queryFn: () => getLeadReport({ period: leadPeriod }).then((r) => r.data),
  });
  const { data: agentData, isLoading: l2 } = useQuery({
    queryKey: ["analytics-agents"],
    queryFn: () => getAgentReport().then((r) => r.data),
  });
  const { data: propData,  isLoading: l3 } = useQuery({
    queryKey: ["analytics-props", propPeriod],
    queryFn: () => getPropertyReport({ period: propPeriod }).then((r) => r.data),
  });
  const { data: revData,   isLoading: l4 } = useQuery({
    queryKey: ["analytics-revenue", revPeriod],
    queryFn: () => getRevenueReport({ period: revPeriod }).then((r) => r.data),
  });
  const { data: botData,   isLoading: l5 } = useQuery({
    queryKey: ["analytics-bot", botPeriod],
    queryFn: () => getBotReport({ period: botPeriod }).then((r) => r.data),
  });

  const loading = l1 || l2 || l3 || l4 || l5;

  // ── Derived ────────────────────────────────────────────────────────────────
  const leads        = leadData  ?? {};
  const agents       = (agentData?.results ?? []) as AgentRow[];
  const props        = propData  ?? {};
  const rev          = revData   ?? { deals: {}, payments: {} };
  const bot          = botData   ?? {};

  const leadTrend: TrendPoint[]  = leads.trend   ?? [];
  const propTrend: TrendPoint[]  = props.trend   ?? [];
  const revTrend:  TrendPoint[]  = rev.deals?.trend ?? [];
  const botTrend:  TrendPoint[]  = bot.trend     ?? [];

  const funnelSteps = [
    { label: "New",       value: leads.by_status?.new       ?? 0, color: "bg-gray-400"     },
    { label: "Warm",      value: leads.by_status?.warm      ?? 0, color: "bg-amber-400"    },
    { label: "Qualified", value: leads.by_status?.qualified ?? 0, color: "bg-blue-500"     },
    { label: "Closed",    value: leads.by_status?.closed    ?? 0, color: "bg-emerald-500"  },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Platform-wide performance metrics</p>
      </div>

      {/* ── Top KPI row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Leads"      value={leads.total ?? 0}             accent="blue"    icon={ClipboardList} />
        <StatCard label="Hot Leads"        value={leads.hot_leads ?? 0}         accent="amber"   icon={Flame} sub={`Avg score ${leads.avg_score ?? 0}`} />
        <StatCard label="Active Agents"    value={agentData?.count ?? 0}        accent="violet"  icon={User} />
        <StatCard label="Properties"       value={props.total ?? 0}             accent="emerald" icon={Home} sub={`Avg score ${props.avg_ai_score ?? 0}`} />
        <StatCard label="Deals (Locked)"  value={rev.deals?.locked ?? 0}   accent="rose"    icon={Lock} />
        <StatCard label="Bot Messages"     value={bot.total_messages ?? 0}      accent="blue"    icon={MessageSquare} sub={`${bot.active_users_7d ?? 0} active this week`} />
      </div>

      {/* ── Lead pipeline + Property breakdown ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <SectionHeader title="Lead Pipeline" sub="Conversion funnel across all stages" />
          <LeadPipelineFunnel data={funnelSteps} />
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-3 text-center">
            {Object.entries(leads.by_intent ?? {}).map(([k, v]) => (
              <div key={k}>
                <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{v as number}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{k}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <SectionHeader title="Property Inventory" sub="Active listings breakdown" />
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">By Type</p>
              <BreakdownBar data={props.by_type ?? {}} />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">By Legal Status</p>
              <BreakdownBar
                data={props.by_legal_status ?? {}}
                colors={{ verified: "bg-emerald-500", unverified: "bg-gray-300", pending: "bg-amber-400", disputed: "bg-rose-500" }}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">By City</p>
              <BreakdownBar data={props.by_city ?? {}} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Trend charts ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="Lead Volume" period={leadPeriod} onPeriodChange={setLeadPeriod}>
          <BarChart data={leadTrend} period={leadPeriod} color="blue" height={32} />
          <div className="mt-4 flex gap-4 text-xs text-[var(--text-muted)]">
            {Object.entries(leads.by_source ?? {}).map(([k, v]) => (
              <span key={k}><strong>{v as number}</strong> {k}</span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Property Listings Added" period={propPeriod} onPeriodChange={setPropPeriod}>
          <BarChart data={propTrend} period={propPeriod} color="emerald" height={32} />
          <div className="mt-4 flex gap-4 text-xs text-[var(--text-muted)]">
            <span><strong>{props.installment_available ?? 0}</strong> with installments</span>
          </div>
        </ChartCard>

        <ChartCard title="Deal Volume" period={revPeriod} onPeriodChange={setRevPeriod}>
          <BarChart data={revTrend} period={revPeriod} color="violet" height={32} />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Locked",    value: rev.deals?.locked     ?? 0 },
              { label: "Released",  value: rev.deals?.released   ?? 0 },
              { label: "Expired",   value: rev.deals?.expired    ?? 0 },
              { label: "Cancelled", value: rev.deals?.cancelled  ?? 0 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Total Deals Locked</span>
              <span className="font-semibold text-[var(--text-primary)]">{rev.deals?.locked ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>Released</span>
              <span className="font-semibold text-[var(--text-primary)]">{rev.deals?.released ?? 0}</span>
            </div>
            {Object.keys(rev.deals?.by_gateway ?? {}).length > 0 && (
              <div className="mt-2">
                <BreakdownBar data={rev.deals?.by_gateway ?? {}} />
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="WhatsApp Bot Activity" period={botPeriod} onPeriodChange={setBotPeriod}>
          <BarChart data={botTrend.length ? botTrend : bot.daily_trend ?? []} period={botPeriod} color="amber" height={32} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{bot.inbound ?? 0}</p>
              <p className="text-xs text-[var(--text-muted)]">Inbound</p>
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{bot.outbound ?? 0}</p>
              <p className="text-xs text-[var(--text-muted)]">Outbound</p>
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{bot.total_sessions ?? 0}</p>
              <p className="text-xs text-[var(--text-muted)]">Sessions</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Active users (7 days)</span>
              <span className="font-semibold text-[var(--text-primary)]">{bot.active_users_7d ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>Active users (30 days)</span>
              <span className="font-semibold text-[var(--text-primary)]">{bot.active_users_30d ?? 0}</span>
            </div>
            {Object.keys(bot.by_message_type ?? {}).length > 0 && (
              <div className="mt-2">
                <BreakdownBar data={bot.by_message_type ?? {}} />
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ── Agent performance table ───────────────────────────────────────── */}
      <div>
        <SectionHeader title="Agent Performance" sub="Active agents ranked by lead volume" />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          {agents.length === 0 ? (
            <div className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">No agents yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3">Agent</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Leads</th>
                  <th className="px-5 py-3 text-right">Closed</th>
                  <th className="px-5 py-3 text-right">Deals</th>
                  <th className="px-5 py-3 text-right">Rating</th>
                  <th className="px-5 py-3 text-right">Conv %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {agents.slice(0, 20).map((a) => {
                  const conv = a.total_leads > 0
                    ? Math.round((a.closed_leads / a.total_leads) * 100)
                    : 0;
                  return (
                    <tr key={a.id} className="hover:bg-[var(--bg-muted)]">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{a.name}</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{a.phone}</p>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{a.primary_city || "—"}</td>
                      <td className="px-5 py-3">
                        <Badge label={a.is_verified ? "Verified" : "Unverified"} variant={a.is_verified ? "green" : "gray"} />
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-[var(--text-primary)]">{a.total_leads}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-medium">{a.closed_leads}</td>
                      <td className="px-5 py-3 text-right text-blue-600">{a.closed_deals}</td>
                      <td className="px-5 py-3 text-right text-[var(--text-muted)]">{a.rating?.toFixed(1) ?? "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-semibold ${conv >= 30 ? "text-emerald-600" : conv >= 10 ? "text-amber-600" : "text-[var(--text-muted)]"}`}>
                          {conv}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}

type AgentRow = {
  id: number; name: string; phone: string; is_verified: boolean;
  total_leads: number; closed_leads: number; closed_deals: number;
  rating: number | null; primary_city: string;
};
