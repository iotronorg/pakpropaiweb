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

export default function DeveloperAnalyticsPage() {
  const [leadPeriod, setLeadPeriod] = useState<Period>("weekly");
  const [propPeriod, setPropPeriod] = useState<Period>("monthly");

  const { data: leadData, isLoading: l1 } = useQuery({
    queryKey: ["dev-analytics-leads", leadPeriod],
    queryFn: () => getLeadReport({ period: leadPeriod }).then((r) => r.data),
  });
  const { data: agentData, isLoading: l2 } = useQuery({
    queryKey: ["dev-analytics-agents"],
    queryFn: () => getAgentReport().then((r) => r.data),
  });
  const { data: propData, isLoading: l3 } = useQuery({
    queryKey: ["dev-analytics-props", propPeriod],
    queryFn: () => getPropertyReport({ period: propPeriod }).then((r) => r.data),
  });

  const loading = l1 || l2 || l3;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const leads  = leadData  ?? {};
  const agents = (agentData?.results ?? []) as AgentRow[];
  const props  = propData  ?? {};

  const leadTrend: TrendPoint[] = leads.trend ?? [];
  const propTrend: TrendPoint[] = props.trend ?? [];

  const funnelSteps = [
    { label: "New",       value: leads.by_status?.new       ?? 0, color: "bg-gray-400"    },
    { label: "Warm",      value: leads.by_status?.warm      ?? 0, color: "bg-amber-400"   },
    { label: "Qualified", value: leads.by_status?.qualified ?? 0, color: "bg-blue-500"    },
    { label: "Closed",    value: leads.by_status?.closed    ?? 0, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-8 pb-10">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Organization-wide performance metrics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Total Leads"    value={leads.total          ?? 0} accent="blue"    icon="📋" />
        <StatCard label="Hot Leads"      value={leads.hot_leads      ?? 0} accent="amber"   icon="🔥" sub={`Avg score ${leads.avg_score ?? 0}`} />
        <StatCard label="Properties"     value={props.total          ?? 0} accent="emerald" icon="🏠" sub={`Avg score ${props.avg_ai_score ?? 0}`} />
        <StatCard label="Active Agents"  value={agentData?.count     ?? 0} accent="violet"  icon="👥" />
        <StatCard label="Installments"   value={props.installment_available ?? 0} accent="rose" icon="💳" />
      </div>

      {/* Funnel + Property breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Lead Pipeline" sub="Conversion funnel across your organization" />
          <LeadPipelineFunnel data={funnelSteps} />
          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-3 text-center">
            {Object.entries(leads.by_intent ?? {}).map(([k, v]) => (
              <div key={k}>
                <p className="text-lg font-bold text-gray-800 tabular-nums">{v as number}</p>
                <p className="text-xs text-gray-400 capitalize">{k}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Property Inventory" sub="Your active listings breakdown" />
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">By Type</p>
              <BreakdownBar data={props.by_type ?? {}} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">By Legal Status</p>
              <BreakdownBar
                data={props.by_legal_status ?? {}}
                colors={{ verified: "bg-emerald-500", unverified: "bg-gray-300", pending: "bg-amber-400", disputed: "bg-rose-500" }}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">By City</p>
              <BreakdownBar data={props.by_city ?? {}} />
            </div>
          </div>
        </div>
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="Lead Volume" period={leadPeriod} onPeriodChange={setLeadPeriod}>
          <BarChart data={leadTrend} period={leadPeriod} color="blue" height={32} />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            {Object.entries(leads.by_source ?? {}).map(([k, v]) => (
              <span key={k}><strong>{v as number}</strong> {k}</span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Property Listings Added" period={propPeriod} onPeriodChange={setPropPeriod}>
          <BarChart data={propTrend} period={propPeriod} color="emerald" height={32} />
          <div className="mt-4 flex gap-4 text-xs text-gray-500">
            <span><strong>{props.installment_available ?? 0}</strong> with installments</span>
          </div>
        </ChartCard>
      </div>

      {/* Team performance */}
      <div>
        <SectionHeader title="Team Performance" sub="Active agents ranked by lead volume" />
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          {agents.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No team members yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
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
              <tbody className="divide-y divide-gray-50">
                {agents.map((a) => {
                  const conv = a.total_leads > 0
                    ? Math.round((a.closed_leads / a.total_leads) * 100)
                    : 0;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{a.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{a.phone}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{a.primary_city || "—"}</td>
                      <td className="px-5 py-3">
                        <Badge label={a.is_verified ? "Verified" : "Unverified"} variant={a.is_verified ? "green" : "gray"} />
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-800">{a.total_leads}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-medium">{a.closed_leads}</td>
                      <td className="px-5 py-3 text-right text-blue-600">{a.closed_deals}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{a.rating?.toFixed(1) ?? "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-semibold ${conv >= 30 ? "text-emerald-600" : conv >= 10 ? "text-amber-600" : "text-gray-400"}`}>
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
