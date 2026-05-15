"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { getProperties, getLeads, getAgentsList, getDealLocks } from "@/lib/api";
import { StatsCard, StatsCardSkeleton } from "@/components/ui/StatsCard";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Property } from "@/types";
import {
  Home, Users, ClipboardList, Lock, TrendingUp,
  AlertTriangle, CheckCircle, Clock, XCircle,
} from "lucide-react";

const container: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

function SectionHeader({ title }: { title: string }) {
  return (
    <motion.div variants={fadeUp} className="mb-3 flex items-center gap-3">
      <span className="h-px flex-1 bg-[var(--border)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{title}</span>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </motion.div>
  );
}

export default function AdminOverview() {
  const { data: propsData,  isLoading: propsLoading  } = useQuery({ queryKey: ["admin-overview-properties"], queryFn: () => getProperties().then((r) => r.data) });
  const { data: leadsData,  isLoading: leadsLoading  } = useQuery({ queryKey: ["admin-overview-leads"],      queryFn: () => getLeads().then((r) => r.data).catch(() => ({ count: 0, results: [] })) });
  const { data: agentsData, isLoading: agentsLoading } = useQuery({ queryKey: ["admin-overview-agents"],     queryFn: () => getAgentsList().then((r) => r.data).catch(() => ({ count: 0, results: [] })) });
  const { data: dealsData,  isLoading: dealsLoading  } = useQuery({ queryKey: ["admin-overview-deals"],      queryFn: () => getDealLocks().then((r) => r.data).catch(() => []) });

  const isLoading = propsLoading || leadsLoading || agentsLoading || dealsLoading;

  const properties:    Property[] = propsData?.results ?? [];
  const totalProps     = propsData?.count ?? 0;
  const verified       = properties.filter((p) => p.legal_status === "verified").length;
  const disputed       = properties.filter((p) => p.legal_status === "disputed").length;
  const pending        = properties.filter((p) => p.legal_status === "pending").length;

  const totalLeads     = leadsData?.count ?? 0;
  const hotLeads       = leadsData?.results?.filter((l: { intent_score: number | null }) => (l.intent_score ?? 0) >= 7).length ?? 0;

  const agentsList     = Array.isArray(agentsData) ? agentsData : (agentsData?.results ?? []);
  const totalAgents    = Array.isArray(agentsData) ? agentsData.length : (agentsData?.count ?? agentsList.length);
  const verifiedAgents = agentsList.filter((a: { is_verified: boolean }) => a.is_verified).length;

  const dealsList      = Array.isArray(dealsData) ? dealsData : (dealsData?.results ?? []);
  const activeDeals    = dealsList.filter((d: { status: string }) => d.status === "locked").length;
  const pendingDeals   = dealsList.filter((d: { status: string }) => d.status === "initiated").length;
  const closedDeals    = dealsList.filter((d: { status: string }) => d.status === "expired" || d.status === "cancelled").length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

      {/* Page header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Platform <span className="gradient-text">Overview</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">System health and activity at a glance</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => <StatsCardSkeleton key={i} />)}
          </div>
        </div>
      ) : (
        <>
          <section>
            <SectionHeader title="Properties" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard index={0} label="Total Listings"   value={totalProps} color="blue"   icon={Home}          trend="up" />
              <StatsCard index={1} label="Verified"         value={verified}   color="green"  icon={CheckCircle}   sub="Clear title" />
              <StatsCard index={2} label="Pending Review"   value={pending}    color="yellow" icon={Clock}         sub="Awaiting check" />
              <StatsCard index={3} label="Disputed"         value={disputed}   color="red"    icon={AlertTriangle} sub="Needs attention" />
            </div>
          </section>

          <section>
            <SectionHeader title="Leads & Agents" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard index={0} label="Total Leads"      value={totalLeads}     color="blue"   icon={ClipboardList} />
              <StatsCard index={1} label="Hot Leads"        value={hotLeads}       color="green"  icon={TrendingUp}    sub="Intent ≥ 7/10" trend="up" />
              <StatsCard index={2} label="Total Agents"     value={totalAgents}    color="purple" icon={Users} />
              <StatsCard index={3} label="Verified Agents"  value={verifiedAgents} color="teal"   icon={CheckCircle}   sub="KYC approved" />
            </div>
          </section>

          <section>
            <SectionHeader title="Deal Locks" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard index={0} label="Total Deals"         value={dealsList.length} color="blue"   icon={Lock} />
              <StatsCard index={1} label="Active Locks"        value={activeDeals}      color="green"  icon={Lock}          sub="48h exclusivity" trend="up" />
              <StatsCard index={2} label="Awaiting Payment"    value={pendingDeals}     color="yellow" icon={Clock}         sub="Initiated, unpaid" />
              <StatsCard index={3} label="Expired / Cancelled" value={closedDeals}      color="red"    icon={XCircle} />
            </div>
          </section>

          {/* Recent listings */}
          <motion.section variants={fadeUp}>
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Listings</h2>
                <span className="text-xs text-[var(--text-muted)]">{properties.length} shown</span>
              </div>

              {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Home size={32} className="mb-3 text-slate-300" />
                  <p className="text-sm text-[var(--text-muted)]">No properties yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {properties.slice(0, 8).map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.04, duration: 0.22 }}
                      className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                          <Home size={13} className="text-sky-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {p.title || `Property #${p.id}`}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {p.city} · {formatDate(p.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {p.ai_score !== null && (
                          <span className="text-xs text-[var(--text-muted)]">
                            AI <span className="font-semibold text-amber-600">{p.ai_score}</span>/100
                          </span>
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
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
