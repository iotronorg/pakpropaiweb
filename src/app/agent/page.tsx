"use client";

import { useQuery } from "@tanstack/react-query";
import { getAgentProfile, getLeads, getMyDealLocks } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AgentProfile, Lead, DealLock } from "@/types";

export default function AgentOverview() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: () => getAgentProfile().then((r) => r.data as AgentProfile),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["agent-leads"],
    queryFn: () => getLeads().then((r) => r.data).catch(() => ({ results: [], count: 0 })),
  });

  const { data: dealsData } = useQuery({
    queryKey: ["my-deal-locks"],
    queryFn: () => getMyDealLocks().then((r) => r.data),
  });

  const isLoading = profileLoading || leadsLoading;
  const leads: Lead[] = leadsData?.results ?? [];
  const myDeals: DealLock[] = dealsData?.results ?? dealsData ?? [];
  const hotLeads = leads.filter((l) => (l.intent_score ?? 0) >= 7);
  const today = new Date().toDateString();
  const todayLeads = leads.filter((l) => new Date(l.created_at).toDateString() === today);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          {profile ? (
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {profile.name}
              {profile.company_name ? ` · ${profile.company_name}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-400">Loading profile…</p>
          )}
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            {profile.is_verified && <Badge label="Verified Agent" variant="green" />}
            {profile.rating !== null && (
              <span className="text-sm font-semibold text-gray-600">⭐ {profile.rating}/5</span>
            )}
          </div>
        )}
      </div>

      {/* Profile summary strip */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard label="Total Leads" value={profile.total_leads} color="blue" />
          <StatsCard label="Hot Leads (7d)" value={hotLeads.length} sub="Intent ≥ 7" color="green" />
          <StatsCard label="Listings" value={profile.total_listings} color="yellow" />
          <StatsCard label="Closed Deals" value={profile.closed_deals} color="blue" />
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Today's snapshot */}
          {!profile && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatsCard label="Total Leads" value={leadsData?.count ?? 0} color="blue" />
              <StatsCard label="Hot Leads" value={hotLeads.length} sub="Intent score ≥ 7" color="green" />
              <StatsCard label="Today's Leads" value={todayLeads.length} color="yellow" />
            </div>
          )}

          {/* Recent leads table */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Recent Leads</h2>
              <span className="text-xs text-gray-400">{todayLeads.length} today</span>
            </div>
            <div className="divide-y divide-gray-50">
              {leads.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.name || l.phone}</p>
                    <p className="text-xs text-gray-400">
                      {l.location_interest ?? "No location"} ·{" "}
                      {l.budget_max ? formatCurrency(l.budget_max) : "Budget unknown"} ·{" "}
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

          {/* My deal locks */}
          {myDeals.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">My Deal Locks</h2>
                <span className="text-xs text-gray-400">{myDeals.length} active</span>
              </div>
              <div className="divide-y divide-gray-50">
                {myDeals.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.property_title}</p>
                      <p className="text-xs text-gray-400">{d.property_city} · {formatCurrency(d.token_amount)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {d.status === "locked" && d.hours_remaining !== null && (
                        <span className={`text-xs font-bold ${d.hours_remaining < 6 ? "text-red-600" : "text-green-600"}`}>
                          {d.hours_remaining.toFixed(1)}h left
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.status === "locked"    ? "bg-green-100 text-green-700"
                        : d.status === "initiated" ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-500"
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cities & areas covered */}
          {profile && (profile.cities.length > 0 || profile.areas.length > 0) && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-4">
              <h2 className="font-semibold text-gray-800 mb-3">Coverage</h2>
              <div className="flex flex-wrap gap-1.5">
                {[...profile.cities, ...profile.areas].map((c, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
