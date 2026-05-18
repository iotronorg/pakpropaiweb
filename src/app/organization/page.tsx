"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrgDashboard, getOrgAIStats } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { StatCard, BreakdownBar, SectionHeader } from "@/components/ui/Charts";
import type { OrgDashboardStats, OrgAIStats } from "@/types";
import Link from "next/link";

export default function OrgOverviewPage() {
  const { data: dash, isLoading: l1 } = useQuery({
    queryKey: ["org-dashboard"],
    queryFn: () => getOrgDashboard().then((r) => r.data as OrgDashboardStats),
  });

  const { data: ai, isLoading: l2 } = useQuery({
    queryKey: ["org-ai-stats"],
    queryFn: () => getOrgAIStats().then((r) => r.data as OrgAIStats),
  });

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const leads     = dash?.leads     ?? { total: 0, hot: 0, new_this_week: 0, routing_queue: 0, by_status: {}, by_intent: {} };
  const agents    = dash?.agents    ?? { active: 0, pending: 0 };
  const inventory = dash?.inventory ?? { total: 0, verified: 0, avg_ai_score: 0, by_type: {} };
  const aiSummary = ai?.summary     ?? {
    chat_success_rate: 0, leads_with_convos: 0, hot_leads: 0, routing_queue: 0,
    total_leads: 0, agent_assigned: 0, qualified_leads: 0, new_this_week: 0,
  };
  const recentConvos = ai?.recent_conversations?.slice(0, 6) ?? [];

  const conversionRate = leads.total > 0
    ? Math.round((leads.by_status?.qualified ?? 0) / leads.total * 100)
    : 0;

  return (
    <div className="space-y-7 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time overview of your AI sales infrastructure
          </p>
        </div>
        <Link
          href="/organization/ai-monitor"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          AI Monitor
        </Link>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard label="Total Leads"    value={leads.total}            accent="blue"    icon="📋" />
        <StatCard label="Hot Leads"      value={leads.hot}              accent="amber"   icon="🔥" sub="Score ≥ 70" />
        <StatCard label="Routing Queue"  value={leads.routing_queue}    accent="violet"  icon="⏳" sub="Unassigned" />
        <StatCard label="Active Agents"  value={agents.active}          accent="emerald" icon="👥" sub={agents.pending ? `${agents.pending} pending` : undefined} />
        <StatCard label="Inventory"      value={inventory.total}        accent="rose"    icon="🏠" sub={`${inventory.verified} verified`} />
      </div>

      {/* AI + Leads row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* AI Performance card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-800">AI Performance</h3>
            <Link href="/organization/ai-monitor" className="text-xs text-amber-600 hover:underline">
              Full view →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white border border-amber-100 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{aiSummary.chat_success_rate}%</p>
              <p className="text-xs text-gray-400 mt-0.5">Chat Success</p>
            </div>
            <div className="rounded-lg bg-white border border-amber-100 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{aiSummary.hot_leads}</p>
              <p className="text-xs text-gray-400 mt-0.5">Hot Leads</p>
            </div>
            <div className="rounded-lg bg-white border border-amber-100 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{aiSummary.routing_queue}</p>
              <p className="text-xs text-gray-400 mt-0.5">In Queue</p>
            </div>
            <div className="rounded-lg bg-white border border-amber-100 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{aiSummary.leads_with_convos}</p>
              <p className="text-xs text-gray-400 mt-0.5">With Convos</p>
            </div>
          </div>
        </div>

        {/* Lead pipeline */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Lead Pipeline</h3>
            <span className="text-xs text-gray-400">{conversionRate}% conversion</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "New",       key: "new",       color: "bg-gray-300" },
              { label: "Warm",      key: "warm",      color: "bg-amber-400" },
              { label: "Qualified", key: "qualified", color: "bg-blue-500"  },
              { label: "Cold",      key: "cold",      color: "bg-slate-300" },
            ].map(({ label, key, color }) => {
              const val = leads.by_status?.[key] ?? 0;
              const pct = leads.total > 0 ? Math.max((val / leads.total) * 100, val > 0 ? 3 : 0) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                    <span className="text-xs font-bold text-gray-800 tabular-nums">{val}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full">
                    <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Inventory Distribution</h3>
            <Link href="/organization/inventory" className="text-xs text-gray-400 hover:text-gray-600">
              View all →
            </Link>
          </div>
          {Object.keys(inventory.by_type).length > 0 ? (
            <BreakdownBar data={inventory.by_type} />
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">No inventory yet</p>
          )}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 tabular-nums">{inventory.verified}</p>
              <p className="text-xs text-gray-400">Verified</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 tabular-nums">{inventory.avg_ai_score}</p>
              <p className="text-xs text-gray-400">Avg AI Score</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 tabular-nums">{inventory.total - inventory.verified}</p>
              <p className="text-xs text-gray-400">Unverified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI conversations */}
      {recentConvos.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <SectionHeader title="Recent AI Conversations" sub="Latest inbound messages across your leads" />
            <Link href="/organization/ai-monitor" className="text-xs text-blue-600 hover:underline shrink-0">
              See all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentConvos.map((c) => (
              <div key={c.lead_id + c.created_at} className="flex items-start gap-4 px-6 py-3.5">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">
                    {(c.lead_name || c.lead_phone).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.lead_name ?? c.lead_phone}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">
                      {new Date(c.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.message_preview}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    c.lead_score >= 70 ? "bg-amber-100 text-amber-700"
                    : c.lead_score >= 40 ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    {c.lead_score}
                  </span>
                  <Badge
                    label={c.lead_status}
                    variant={c.lead_status === "qualified" ? "green" : c.lead_status === "cold" ? "gray" : "yellow"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intent breakdown */}
      {Object.keys(leads.by_intent).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Intent Breakdown</h3>
          <BreakdownBar data={leads.by_intent} />
        </div>
      )}
    </div>
  );
}
