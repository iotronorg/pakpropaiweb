"use client";

import { useQuery } from "@tanstack/react-query";
import { getProperties, getLeads, getAgentsList, getDealLocks } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Property } from "@/types";

export default function AdminOverview() {
  const { data: propsData, isLoading: propsLoading } = useQuery({
    queryKey: ["admin-overview-properties"],
    queryFn: () => getProperties().then((r) => r.data),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["admin-overview-leads"],
    queryFn: () => getLeads().then((r) => r.data).catch(() => ({ count: 0, results: [] })),
  });

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["admin-overview-agents"],
    queryFn: () => getAgentsList().then((r) => r.data).catch(() => ({ count: 0, results: [] })),
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ["admin-overview-deals"],
    queryFn: () => getDealLocks().then((r) => r.data).catch(() => []),
  });

  const isLoading = propsLoading || leadsLoading || agentsLoading || dealsLoading;

  const properties: Property[] = propsData?.results ?? [];
  const totalProps    = propsData?.count ?? 0;
  const verified      = properties.filter((p) => p.legal_status === "verified").length;
  const disputed      = properties.filter((p) => p.legal_status === "disputed").length;
  const pending       = properties.filter((p) => p.legal_status === "pending").length;

  const totalLeads    = leadsData?.count ?? 0;

  // agents endpoint returns array or paginated
  const agentsList    = Array.isArray(agentsData) ? agentsData : (agentsData?.results ?? []);
  const totalAgents   = Array.isArray(agentsData) ? agentsData.length : (agentsData?.count ?? agentsList.length);
  const verifiedAgents = agentsList.filter((a: { is_verified: boolean }) => a.is_verified).length;

  const dealsList     = Array.isArray(dealsData) ? dealsData : (dealsData?.results ?? []);
  const activeDeals   = dealsList.filter((d: { status: string }) => d.status === "locked").length;
  const pendingDeals  = dealsList.filter((d: { status: string }) => d.status === "initiated").length;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="mt-1 text-sm text-gray-500">System health and activity at a glance</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Properties */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Properties</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard label="Total Properties" value={totalProps} color="blue" />
              <StatsCard label="Verified" value={verified} color="green" />
              <StatsCard label="Pending" value={pending} sub="Awaiting review" color="yellow" />
              <StatsCard label="Disputed" value={disputed} sub="Needs attention" color="red" />
            </div>
          </section>

          {/* Leads + Agents */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Leads & Agents</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard label="Total Leads" value={totalLeads} color="blue" />
              <StatsCard
                label="Hot Leads"
                value={leadsData?.results?.filter((l: { intent_score: number | null }) => (l.intent_score ?? 0) >= 7).length ?? 0}
                sub="Intent ≥ 7/10"
                color="green"
              />
              <StatsCard label="Total Agents" value={totalAgents} color="yellow" />
              <StatsCard label="Verified Agents" value={verifiedAgents} color="green" />
            </div>
          </section>

          {/* Deal Locks */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Deal Locks</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard label="Total Deals" value={dealsList.length} color="blue" />
              <StatsCard label="Active Locks" value={activeDeals} sub="48h exclusivity" color="green" />
              <StatsCard label="Awaiting Payment" value={pendingDeals} sub="Initiated, not paid" color="yellow" />
              <StatsCard
                label="Expired / Cancelled"
                value={dealsList.filter((d: { status: string }) => d.status === "expired" || d.status === "cancelled").length}
                color="red"
              />
            </div>
          </section>

          {/* Recent listings */}
          <section>
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-800">Recent Listings</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {properties.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.title || `Property #${p.id}`}</p>
                      <p className="text-xs text-gray-400">{p.city} · {formatDate(p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.ai_score !== null && (
                        <span className="text-xs text-gray-400">AI {p.ai_score}/100</span>
                      )}
                      <Badge
                        label={p.legal_status}
                        variant={
                          p.legal_status === "verified" ? "green"
                          : p.legal_status === "disputed" ? "red"
                          : "yellow"
                        }
                      />
                    </div>
                  </div>
                ))}
                {properties.length === 0 && (
                  <p className="px-6 py-8 text-center text-sm text-gray-400">No properties yet</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
