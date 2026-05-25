"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAgentStats } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatsCard } from "@/components/ui/StatsCard";
import { Badge } from "@/components/ui/Badge";
import {
  LeadPipelineFunnel,
  SectionHeader,
  ChartCard,
  BarChart,
  type Period,
  type TrendPoint,
} from "@/components/ui/Charts";
import { AgentStats } from "@/types";
import {
  Users,
  TrendingUp,
  Briefcase,
  Clock,
  Star,
} from "lucide-react";

export default function OrgAgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [period, setPeriod] = useState<Period>("weekly");
  const agentId = parseInt(params.id, 10);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["agent-stats", agentId, period],
    queryFn: () =>
      getAgentStats(agentId, { period }).then((r) => r.data as AgentStats),
    enabled: !isNaN(agentId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        Failed to load agent data. Please refresh the page.
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Agent not found.</p>
      </div>
    );
  }

  const funnelSteps = [
    { label: "New",       value: stats.by_status?.new       ?? 0, color: "bg-gray-400"    },
    { label: "Warm",      value: stats.by_status?.warm      ?? 0, color: "bg-sky-400"     },
    { label: "Qualified", value: stats.by_status?.qualified ?? 0, color: "bg-blue-500"    },
    { label: "Cold",      value: stats.by_status?.cold      ?? 0, color: "bg-orange-300"  },
    { label: "Closed",    value: stats.closed_leads,               color: "bg-emerald-500" },
  ];

  const ratingDisplay = stats.rating > 0 ? `${stats.rating.toFixed(1)} / 5` : "—";
  const responseDisplay =
    stats.avg_response_time_hours != null
      ? `${stats.avg_response_time_hours}h`
      : "—";

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/organization/agents"
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            ← Back to Agent Performance
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm font-bold text-blue-700">
                {stats.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{stats.name}</h1>
                {stats.is_verified && (
                  <Badge label="Verified" variant="green" />
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  stats.availability_status === "available" ? "bg-green-100 text-green-700"
                  : stats.availability_status === "busy"    ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    stats.availability_status === "available" ? "bg-green-500"
                    : stats.availability_status === "busy"    ? "bg-amber-500"
                    : "bg-gray-400"
                  }`} />
                  {stats.availability_status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Agent ID #{stats.agent_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          label="Leads Handled"
          value={stats.total_leads}
          color="blue"
          icon={Users}
          index={0}
        />
        <StatsCard
          label="Conversion Rate"
          value={`${stats.conversion_rate.toFixed(1)}%`}
          color="green"
          icon={TrendingUp}
          index={1}
        />
        <StatsCard
          label="Closed Deals"
          value={stats.closed_deals}
          color="purple"
          icon={Briefcase}
          index={2}
        />
        <StatsCard
          label="Avg Response Time"
          value={responseDisplay}
          color="yellow"
          icon={Clock}
          index={3}
        />
        <StatsCard
          label="Rating"
          value={ratingDisplay}
          color="teal"
          icon={Star}
          index={4}
        />
      </div>

      {/* Funnel + Trend grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader
            title="Lead Pipeline"
            sub="All-time conversion funnel for this agent"
          />
          <LeadPipelineFunnel data={funnelSteps} />
        </div>

        <ChartCard title="Lead Volume Trend" period={period} onPeriodChange={setPeriod}>
          <BarChart
            data={(stats.trend ?? []) as TrendPoint[]}
            period={period}
            color="blue"
            height={32}
          />
          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-800 tabular-nums">{stats.total_leads}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{stats.closed_leads}</p>
              <p className="text-xs text-gray-400">Closed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600 tabular-nums">
                {stats.conversion_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400">Conversion</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Footer */}
      <div className="flex justify-end">
        <Link
          href="/organization/leads"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View all leads →
        </Link>
      </div>
    </div>
  );
}
