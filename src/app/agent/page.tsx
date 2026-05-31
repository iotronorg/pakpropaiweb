"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { getAgentProfile, getLeads, getMyDealLocks } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AgentProfile, Lead, DealLock } from "@/types";
import { Star, ClipboardList, Flame, Home, Lock } from "lucide-react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] } },
};

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-10"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agent Dashboard</h1>
          {profile ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Welcome back, {profile.name}
              {profile.company_name ? ` · ${profile.company_name}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-muted)]">Loading profile…</p>
          )}
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            {profile.is_verified && <Badge label="Verified Agent" variant="green" />}
            {profile.rating !== null && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-muted)]">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                {profile.rating}/5
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* Profile summary strip */}
      {profile && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard index={0} label="Total Leads"    value={profile.total_leads}    color="blue"   icon={ClipboardList} />
          <StatsCard index={1} label="Hot Leads (7d)" value={hotLeads.length}        color="green"  icon={Flame} sub="Intent ≥ 7" />
          <StatsCard index={2} label="Listings"       value={profile.total_listings} color="yellow" icon={Home} />
          <StatsCard index={3} label="Closed Deals"   value={profile.closed_deals}   color="blue"   icon={Lock} />
        </motion.div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Today's snapshot (fallback when no profile) */}
          {!profile && (
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatsCard index={0} label="Total Leads"   value={leadsData?.count ?? 0} color="blue" />
              <StatsCard index={1} label="Hot Leads"     value={hotLeads.length}       color="green" sub="Intent score ≥ 7" />
              <StatsCard index={2} label="Today's Leads" value={todayLeads.length}     color="yellow" />
            </motion.div>
          )}

          {/* Recent leads table */}
          <motion.div variants={fadeUp} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">Recent Leads</h2>
              <span className="text-xs text-[var(--text-muted)]">{todayLeads.length} today</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {leads.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{l.name || l.phone}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {l.location_interest ?? "No location"} ·{" "}
                      {l.budget_max ? formatCurrency(l.budget_max, l.budget_currency ?? "PKR") : "Budget unknown"} ·{" "}
                      {formatDate(l.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ms-4">
                    {l.intent_score !== null && (
                      <span className="text-xs font-bold text-[var(--text-muted)]">
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
                <div className="px-6 py-12 text-center">
                  <ClipboardList size={28} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-[var(--text-muted)]">No leads yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Leads appear here when buyers connect via WhatsApp</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* My deal locks */}
          {myDeals.length > 0 && (
            <motion.div variants={fadeUp} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
                <h2 className="font-semibold text-[var(--text-primary)]">My Deal Locks</h2>
                <span className="text-xs text-[var(--text-muted)]">{myDeals.length} active</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {myDeals.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{d.property_title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{d.property_city} · {formatCurrency(d.token_amount, d.currency)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ms-4">
                      {d.status === "locked" && d.hours_remaining !== null && (
                        <span className={`text-xs font-bold ${d.hours_remaining < 6 ? "text-red-600" : "text-emerald-600"}`}>
                          {d.hours_remaining.toFixed(1)}h left
                        </span>
                      )}
                      <Badge
                        label={d.status}
                        variant={d.status === "locked" ? "green" : d.status === "initiated" ? "yellow" : "gray"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cities & areas covered */}
          {profile && (profile.cities.length > 0 || profile.areas.length > 0) && (
            <motion.div variants={fadeUp} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
              <h2 className="font-semibold text-[var(--text-primary)] mb-3">Coverage</h2>
              <div className="flex flex-wrap gap-1.5">
                {[...profile.cities, ...profile.areas].map((c, i) => (
                  <span key={i} className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-100">
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
