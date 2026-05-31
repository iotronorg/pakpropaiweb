"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, getLeadStats, getAgentsList, assignAgentToLead, autoAssignLead } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import type { Lead, LeadStats } from "@/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_TABS = ["all", "new", "warm", "qualified", "cold"] as const;

export default function OrgLeadsPage() {
  const qc = useQueryClient();
  const [tab,    setTab]    = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["org-leads", tab, search, page],
    queryFn: () =>
      getLeads({
        ...(tab !== "all" ? { status: tab } : {}),
        ...(search ? { search } : {}),
        page,
      }).then((r) => r.data),
  });

  const { data: agentsData } = useQuery({
    queryKey: ["org-agents-list"],
    queryFn: () => getAgentsList({ status: "approved" }).then((r) => r.data),
  });

  const assignMutation = useMutation({
    mutationFn: ({ leadId, agentId }: { leadId: string; agentId: number }) =>
      assignAgentToLead(leadId, agentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-leads"] }),
  });

  const autoMutation = useMutation({
    mutationFn: (leadId: string) => autoAssignLead(leadId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-leads"] }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => getLeadStats().then((r) => r.data as LeadStats),
  });

  const leads: Lead[]  = data?.results ?? [];
  const total: number  = data?.count   ?? 0;
  const agents         = agentsData?.results ?? agentsData ?? [];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leads</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          All leads scoped to your organization — assign, route, and track
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Hot Leads (≥70)", value: statsData?.hot_leads ?? "—", color: "text-amber-600" },
          { label: "Unassigned", value: statsData?.unassigned ?? "—", color: "text-red-500" },
          { label: "Avg Score", value: statsData?.avg_score != null ? statsData.avg_score : "—", color: "text-blue-600" },
          { label: "New Today", value: statsData?.new_today ?? "—", color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-[var(--bg-surface)] text-blue-600 shadow-sm border border-[var(--border)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-muted)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <label htmlFor="leads-search" className="sr-only">Search leads</label>
        <input
          id="leads-search"
          type="text"
          placeholder="Search by phone, name, city…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-72"
        />
        <span className="text-sm text-[var(--text-muted)]">{total} leads</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Lead", "City / Budget", "Score", "Status", "Intent", "Source", "Agent", "Actions", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-start text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-[var(--text-muted)]">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{lead.name ?? lead.phone}</p>
                        {lead.name && <p className="text-xs text-[var(--text-muted)]">{lead.phone}</p>}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)] text-xs">
                        <p>{lead.location_interest ?? "—"}</p>
                        {lead.budget_max && (
                          <p className="text-[var(--text-muted)]">
                            {formatCurrency(lead.budget_max, lead.budget_currency ?? "PKR")}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {lead.intent_score !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-14 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (lead.intent_score ?? 0) >= 70 ? "bg-amber-500"
                                  : (lead.intent_score ?? 0) >= 40 ? "bg-blue-400"
                                  : "bg-gray-400"
                                }`}
                                style={{ width: `${lead.intent_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-[var(--text-muted)]">{lead.intent_score}</span>
                          </div>
                        ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          label={lead.status}
                          variant={
                            lead.status === "qualified" ? "green"
                            : lead.status === "warm"    ? "yellow"
                            : lead.status === "cold"    ? "gray"
                            : "yellow"
                          }
                        />
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)] capitalize text-xs">{lead.intent ?? "—"}</td>
                      <td className="px-5 py-3 text-[var(--text-muted)] capitalize text-xs">{lead.source ?? "—"}</td>
                      <td className="px-5 py-3 text-xs">
                        {lead.assigned_agent_name ? (
                          <span className="font-medium text-[var(--text-muted)]">{lead.assigned_agent_name}</span>
                        ) : (
                          <span className="text-[var(--text-muted)] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const agentId = Number(e.target.value);
                              if (agentId) assignMutation.mutate({ leadId: lead.id, agentId });
                            }}
                            className="text-xs border border-[var(--border)] rounded px-1.5 py-1 text-[var(--text-muted)] focus:outline-none"
                          >
                            <option value="">Assign…</option>
                            {agents.map((a: { id: number; name: string }) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => autoMutation.mutate(lead.id)}
                            disabled={autoMutation.isPending}
                            aria-label="Auto-assign lead"
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Auto
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/organization/leads/${lead.id}`}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={20}
        onPage={setPage}
      />
    </div>
  );
}
