"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeadReport, getAgentReport, getPropertyReport } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import {
  StatCard, ChartCard, BarChart, BreakdownBar, LeadPipelineFunnel,
  SectionHeader, type Period, type TrendPoint,
} from "@/components/ui/Charts";
import type { AgentPerformanceRow, LeadReportData, PropertyReportData } from "@/types";

export default function OrgAnalyticsPage() {
  const [leadPeriod, setLeadPeriod] = useState<Period>("weekly");
  const [propPeriod, setPropPeriod] = useState<Period>("monthly");

  const { data: leadData,  isLoading: l1 } = useQuery({
    queryKey: ["org-analytics-leads", leadPeriod],
    queryFn: () => getLeadReport({ period: leadPeriod }).then((r) => r.data as LeadReportData),
  });
  const { data: agentData, isLoading: l2 } = useQuery({
    queryKey: ["org-analytics-agents"],
    queryFn: () => getAgentReport().then((r) => r.data),
  });
  const { data: propData,  isLoading: l3 } = useQuery({
    queryKey: ["org-analytics-props", propPeriod],
    queryFn: () => getPropertyReport({ period: propPeriod }).then((r) => r.data as PropertyReportData),
  });

  if (l1 || l2 || l3) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const leads  = leadData  ?? { total: 0, avg_score: 0, hot_leads: 0, by_status: {}, by_intent: {}, by_source: {} };
  const agents = (agentData?.results ?? []) as AgentPerformanceRow[];
  const props  = propData  ?? { total: 0, avg_ai_score: 0, installment_available: 0, by_type: {}, by_legal_status: {}, by_risk_level: {}, by_city: {} };

  const leadTrend: TrendPoint[] = leadData?.trend  ?? [];
  const propTrend: TrendPoint[] = propData?.trend  ?? [];

  const funnelSteps = [
    { label: "New",       value: leads.by_status?.new       ?? 0, color: "bg-gray-400"    },
    { label: "Warm",      value: leads.by_status?.warm      ?? 0, color: "bg-amber-400"   },
    { label: "Qualified", value: leads.by_status?.qualified ?? 0, color: "bg-blue-500"    },
    { label: "Cold",      value: leads.by_status?.cold      ?? 0, color: "bg-slate-300"   },
  ];

  const convRate = leads.total > 0
    ? Math.round(((leads.by_status?.qualified ?? 0) / leads.total) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Organization-scoped lead, agent, and inventory performance metrics
        </p>
      </div>

      {/* Lead KPIs */}
      <div>
        <SectionHeader title="Lead Analytics" sub="All leads scoped to your organization" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Leads"   value={leads.total}     accent="blue"    icon="📋" />
          <StatCard label="Hot Leads"     value={leads.hot_leads} accent="amber"   icon="🔥" sub="Score ≥ 70" />
          <StatCard label="Avg Score"     value={leads.avg_score} accent="violet"  icon="📊" />
          <StatCard label="Conversion"    value={`${convRate}%`}  accent="emerald" icon="✅" sub="→ Qualified" />
        </div>
      </div>

      {/* Lead trend + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {leadTrend.length > 0 && (
          <ChartCard title="Lead Volume" period={leadPeriod} onPeriodChange={setLeadPeriod}>
            <BarChart data={leadTrend} period={leadPeriod} color="blue" height={28} />
          </ChartCard>
        )}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Pipeline Funnel</h3>
          <LeadPipelineFunnel data={funnelSteps} />
        </div>
      </div>

      {/* Lead intent + source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">By Intent</h3>
          {Object.keys(leads.by_intent).length > 0
            ? <BreakdownBar data={leads.by_intent} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">By Source</h3>
          {Object.keys(leads.by_source).length > 0
            ? <BreakdownBar data={leads.by_source} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
      </div>

      {/* Inventory analytics */}
      <div>
        <SectionHeader title="Inventory Analytics" sub="Active listings in your organization" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <StatCard label="Total Listings"     value={props.total}                accent="blue"    icon="🏠" />
          <StatCard label="Verified"           value={props.by_legal_status?.verified ?? 0} accent="emerald" icon="✅" />
          <StatCard label="Installment Plans"  value={props.installment_available} accent="violet"  icon="📅" />
          <StatCard label="Avg AI Score"       value={`${props.avg_ai_score}/100`} accent="amber"   icon="🤖" />
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Legal Status Breakdown</h3>
            {Object.keys(props.by_legal_status).length > 0
              ? <BreakdownBar data={props.by_legal_status} />
              : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Level Distribution</h3>
            {Object.keys(props.by_risk_level).length > 0
              ? <BreakdownBar
                  data={props.by_risk_level}
                  colors={{ low: "bg-emerald-500", medium: "bg-amber-400", high: "bg-red-500" }}
                />
              : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
          </div>
        </div>
      </div>

      {/* Agent performance */}
      {agents.length > 0 && (
        <div>
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
              <tbody className="divide-y divide-gray-50">
                {agents.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs font-bold text-gray-400 tabular-nums">
                      #{i + 1}
                    </td>
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
