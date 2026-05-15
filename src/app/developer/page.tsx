"use client";

import { useQuery } from "@tanstack/react-query";
import { getProperties, getLeads, getTeam } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuthStore } from "@/store/auth";
import { Property, Lead } from "@/types";

interface TeamMember {
  id: number;
  name: string;
  availability_status: string;
}

export default function DeveloperOverview() {
  const { user } = useAuthStore();

  const { data: propData, isLoading: propLoading } = useQuery({
    queryKey: ["dev-properties"],
    queryFn: () => getProperties().then((r) => r.data),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["dev-leads-overview"],
    queryFn: () => getLeads().then((r) => r.data).catch(() => ({ results: [], count: 0 })),
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["dev-team"],
    queryFn: () => getTeam().then((r) => r.data).catch(() => []),
  });

  const isLoading = propLoading || leadsLoading || teamLoading;

  const properties: Property[] = propData?.results ?? [];
  const leads: Lead[] = leadsData?.results ?? [];
  const team: TeamMember[] = teamData?.results ?? teamData ?? [];

  const totalUnits = propData?.count ?? 0;
  const verifiedUnits = properties.filter((p) => p.legal_status === "verified").length;
  const totalLeads = leadsData?.count ?? leads.length;
  const hotLeads = leads.filter((l) => (l.intent_score ?? 0) >= 7).length;
  const teamMembers = team.length;
  const activeAgents = team.filter((m) => m.availability_status === "available").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Project inventory and lead performance for {user?.name || user?.phone}
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-8">
            <StatsCard label="Total Inventory" value={totalUnits} color="blue" />
            <StatsCard label="Verified Units" value={verifiedUnits} sub="Legal status confirmed" color="green" />
            <StatsCard label="Total Leads" value={totalLeads} color="yellow" />
            <StatsCard label="Hot Leads" value={hotLeads} sub="Intent score ≥ 7" color="green" />
            <StatsCard label="Team Members" value={teamMembers} color="blue" />
            <StatsCard label="Active Agents" value={activeAgents} sub="Available right now" color="green" />
          </div>
        </>
      )}
    </div>
  );
}
