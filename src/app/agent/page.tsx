"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

interface Lead {
  id: number;
  phone: string;
  name: string | null;
  budget_max: number | null;
  location_interest: string | null;
  intent_score: number | null;
  status: string;
  created_at: string;
}

export default function AgentOverview() {
  const { user } = useAuthStore();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["agent-leads"],
    queryFn: () => api.get("/leads/").then((r) => r.data).catch(() => ({ results: [], count: 0 })),
  });

  const leads: Lead[] = leadsData?.results ?? [];
  const hotLeads = leads.filter((l) => (l.intent_score ?? 0) >= 7);
  const today = new Date().toDateString();
  const todayLeads = leads.filter((l) => new Date(l.created_at).toDateString() === today);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back, {user?.name || user?.phone}</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-8">
            <StatsCard label="Total Leads" value={leadsData?.count ?? 0} color="blue" />
            <StatsCard label="Hot Leads" value={hotLeads.length} sub="Intent score ≥ 7" color="green" />
            <StatsCard label="Today's Leads" value={todayLeads.length} color="yellow" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-800">Recent Leads</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {leads.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.name || l.phone}</p>
                    <p className="text-xs text-gray-400">
                      {l.location_interest ?? "No location"} ·{" "}
                      {l.budget_max ? formatPKR(l.budget_max) : "Budget unknown"} ·{" "}
                      {formatDate(l.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.intent_score !== null && (
                      <span className="text-xs font-bold text-gray-500">
                        Score {l.intent_score}/10
                      </span>
                    )}
                    <Badge
                      label={l.status}
                      variant={l.status === "qualified" ? "green" : l.status === "cold" ? "gray" : "yellow"}
                    />
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="px-6 py-10 text-center text-sm text-gray-400">
                  No leads yet — they appear here when buyers connect via WhatsApp
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
