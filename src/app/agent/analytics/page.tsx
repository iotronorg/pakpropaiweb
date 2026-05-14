"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAgentPersonalReport } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  StatCard, ChartCard, BarChart, BreakdownBar, LeadPipelineFunnel,
  SectionHeader, type Period, type TrendPoint,
} from "@/components/ui/Charts";

export default function AgentAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("weekly");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["agent-my-stats", period],
    queryFn: () => getAgentPersonalReport({ period }).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = raw ?? {};
  const trend: TrendPoint[] = stats.trend ?? [];

  const funnelSteps = [
    { label: "New",         value: stats.by_status?.new         ?? 0, color: "bg-gray-400"    },
    { label: "Contacted",   value: stats.by_status?.contacted   ?? 0, color: "bg-sky-400"     },
    { label: "Interested",  value: stats.by_status?.interested  ?? 0, color: "bg-amber-400"   },
    { label: "Qualified",   value: stats.by_status?.qualified   ?? 0, color: "bg-blue-500"    },
    { label: "Closed",      value: stats.by_status?.closed      ?? 0, color: "bg-emerald-500" },
  ];

  const convRate = stats.total_leads > 0
    ? Math.round(((stats.closed_leads ?? 0) / stats.total_leads) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-10">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Your personal performance metrics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Leads"    value={stats.total_leads   ?? 0} accent="blue"    icon="📋" />
        <StatCard label="Hot Leads"      value={stats.hot_leads     ?? 0} accent="amber"   icon="🔥" sub={`Avg score ${stats.avg_score ?? 0}`} />
        <StatCard label="Closed Leads"   value={stats.closed_leads  ?? 0} accent="emerald" icon="✅" />
        <StatCard label="My Listings"    value={stats.total_listings ?? 0} accent="violet"  icon="🏠" />
        <StatCard label="Closed Deals"   value={stats.closed_deals  ?? 0} accent="rose"    icon="🔒" />
        <StatCard label="Conversion"     value={`${convRate}%`}           accent="blue"    icon="📈" sub={`Rating ${stats.rating?.toFixed(1) ?? "—"}`} />
      </div>

      {/* Funnel + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="My Lead Pipeline" sub="Conversion funnel across your assigned leads" />
          <LeadPipelineFunnel data={funnelSteps} />
          {Object.keys(stats.by_source ?? {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-2">By Source</p>
              <BreakdownBar data={stats.by_source ?? {}} />
            </div>
          )}
        </div>

        <ChartCard title="Lead Volume" period={period} onPeriodChange={setPeriod}>
          <BarChart data={trend} period={period} color="blue" height={32} />
          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-800 tabular-nums">{stats.total_leads ?? 0}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{stats.closed_leads ?? 0}</p>
              <p className="text-xs text-gray-400">Closed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600 tabular-nums">{stats.hot_leads ?? 0}</p>
              <p className="text-xs text-gray-400">Hot</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Verification badge */}
      {stats.is_verified === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your account is not yet verified. Contact your admin to get verified and build client trust.
        </div>
      )}

    </div>
  );
}
