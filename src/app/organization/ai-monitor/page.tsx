"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrgAIStats, getAgentReport, getLeadReport } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { StatCard, ChartCard, BarChart, BreakdownBar, SectionHeader, type Period, type TrendPoint } from "@/components/ui/Charts";
import type { OrgAIStats, AgentPerformanceRow } from "@/types";
import { useState } from "react";

function SuccessRateRing({ rate }: { rate: number }) {
  const r   = 38;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8" className="stroke-gray-100" />
        <circle
          cx="48" cy="48" r={r}
          fill="none" strokeWidth="8"
          className="stroke-amber-500 transition-all duration-700"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold text-gray-900 tabular-nums">{rate}%</p>
        <p className="text-[10px] text-gray-400 leading-none">success</p>
      </div>
    </div>
  );
}

export default function AIMonitorPage() {
  const [leadPeriod, setLeadPeriod] = useState<Period>("weekly");

  const { data: aiData, isLoading: l1 } = useQuery({
    queryKey: ["org-ai-stats"],
    queryFn: () => getOrgAIStats().then((r) => r.data as OrgAIStats),
    refetchInterval: 30_000,
  });

  const { data: agentData, isLoading: l2 } = useQuery({
    queryKey: ["org-agent-report"],
    queryFn: () => getAgentReport().then((r) => r.data),
  });

  const { data: leadData, isLoading: l3 } = useQuery({
    queryKey: ["org-lead-report", leadPeriod],
    queryFn: () => getLeadReport({ period: leadPeriod }).then((r) => r.data),
  });

  if (l1 || l2 || l3) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const s       = aiData?.summary ?? {
    total_leads: 0, hot_leads: 0, routing_queue: 0, agent_assigned: 0,
    qualified_leads: 0, new_this_week: 0, leads_with_convos: 0, chat_success_rate: 0,
  };
  const convos  = aiData?.recent_conversations ?? [];
  const agents  = (agentData?.results ?? []) as AgentPerformanceRow[];
  const ld      = leadData ?? {};
  const trend: TrendPoint[] = ld.trend ?? [];

  const channelBreakdown: Record<string, number> = convos.reduce(
    (acc: Record<string, number>, c) => {
      acc[c.channel] = (acc[c.channel] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topAgents = [...agents]
    .sort((a, b) => b.total_leads - a.total_leads)
    .slice(0, 5);

  return (
    <div className="space-y-7 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Performance Monitor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time AI conversation analytics, lead routing status, and agent performance
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">Live · 30s refresh</span>
        </div>
      </div>

      {/* AI KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard label="Chat Success Rate" value={`${s.chat_success_rate}%`} accent="amber"   icon="🤖" sub="Convos → qualified" />
        <StatCard label="Hot Leads"          value={s.hot_leads}              accent="amber"   icon="🔥" sub="Score ≥ 70" />
        <StatCard label="Routing Queue"      value={s.routing_queue}          accent="violet"  icon="⏳" sub="Awaiting agent" />
        <StatCard label="Agent Assigned"     value={s.agent_assigned}         accent="blue"    icon="👤" sub="Active assignments" />
        <StatCard label="With Conversations" value={s.leads_with_convos}      accent="emerald" icon="💬" sub="AI-engaged leads" />
      </div>

      {/* Success ring + routing breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chat success ring */}
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 flex flex-col items-center gap-4">
          <h3 className="text-sm font-semibold text-amber-800 self-start">Chat Success Rate</h3>
          <SuccessRateRing rate={s.chat_success_rate} />
          <div className="w-full grid grid-cols-2 gap-3 text-center text-xs">
            <div className="rounded-lg bg-white/70 py-2.5">
              <p className="text-lg font-bold text-gray-900 tabular-nums">{s.leads_with_convos}</p>
              <p className="text-gray-400">Total Conversations</p>
            </div>
            <div className="rounded-lg bg-white/70 py-2.5">
              <p className="text-lg font-bold text-gray-900 tabular-nums">{s.qualified_leads}</p>
              <p className="text-gray-400">Qualified</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-700 text-center leading-snug">
            % of leads with conversations that reached Qualified or Hot status
          </p>
        </div>

        {/* Routing state breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">AI Routing Queue State</h3>
          <div className="space-y-4">
            {[
              { label: "In AI Queue (unscoped)", value: s.total_leads - s.routing_queue - s.agent_assigned - s.qualified_leads, color: "bg-gray-300" },
              { label: "Org Queue (unassigned)", value: s.routing_queue,   color: "bg-violet-400" },
              { label: "Agent Assigned",         value: s.agent_assigned,  color: "bg-blue-500"   },
              { label: "Qualified / Closed",     value: s.qualified_leads, color: "bg-emerald-500"},
            ].map(({ label, value, color }) => {
              const total = s.total_leads || 1;
              const pct   = Math.max((Math.max(value, 0) / total) * 100, value > 0 ? 4 : 0);
              return (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-bold text-gray-800 tabular-nums">{Math.max(value, 0)}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full">
                    <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* New leads this week + channel split */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
          <div>
            <p className="text-xs text-gray-400 mb-1">New Leads This Week</p>
            <p className="text-4xl font-bold text-gray-900 tabular-nums">{s.new_this_week}</p>
          </div>
          {Object.keys(channelBreakdown).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3">Conversation Channels (recent)</p>
              <BreakdownBar data={channelBreakdown} />
            </div>
          )}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <p className="text-lg font-bold text-gray-900 tabular-nums">{s.hot_leads}</p>
                <p className="text-gray-400">Hot Today</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 tabular-nums">{s.routing_queue}</p>
                <p className="text-gray-400">Queue Depth</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead trend */}
      {trend.length > 0 && (
        <ChartCard title="Lead Volume Trend" period={leadPeriod} onPeriodChange={setLeadPeriod}>
          <BarChart data={trend} period={leadPeriod} color="blue" height={32} />
        </ChartCard>
      )}

      {/* Recent AI conversations */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Recent AI Conversations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 15 inbound messages handled by the AI</p>
          </div>
          <span className="text-xs text-gray-400">{convos.length} shown</span>
        </div>
        {convos.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No conversations yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {convos.map((c) => (
              <div key={c.lead_id + c.created_at} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 px-6 py-3.5">
                {/* Avatar */}
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                  c.lead_score >= 70 ? "bg-amber-100 text-amber-700"
                  : c.lead_score >= 40 ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
                }`}>
                  {(c.lead_name || c.lead_phone).slice(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{c.lead_name ?? c.lead_phone}</p>
                    {c.lead_name && (
                      <span className="text-xs text-gray-400">{c.lead_phone}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">{c.message_preview}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric",
                    })}{" "}
                    {new Date(c.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit",
                    })}{" "}
                    · via {c.channel}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
                    c.lead_score >= 70 ? "bg-amber-100 text-amber-700"
                    : c.lead_score >= 40 ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    Score {c.lead_score}
                  </span>
                  <Badge
                    label={c.lead_status}
                    variant={c.lead_status === "qualified" ? "green" : c.lead_status === "cold" ? "gray" : "yellow"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent performance table */}
      {topAgents.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <SectionHeader title="Agent Performance" sub="Ranked by total leads assigned" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Agent", "City", "Leads", "Qualified", "Deals", "Rating", "Status"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topAgents.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
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
                    <td className="px-6 py-3 text-gray-600">{a.primary_city || "—"}</td>
                    <td className="px-6 py-3 font-bold text-gray-900 tabular-nums">{a.total_leads}</td>
                    <td className="px-6 py-3 text-gray-600 tabular-nums">{a.closed_leads}</td>
                    <td className="px-6 py-3 text-gray-600 tabular-nums">{a.closed_deals}</td>
                    <td className="px-6 py-3">
                      {a.rating > 0 ? (
                        <span className="font-medium text-gray-800">⭐ {a.rating.toFixed(1)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={a.is_verified ? "Verified" : "Pending"} variant={a.is_verified ? "green" : "yellow"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
