"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, getAgentsList, assignAgentToLead, autoAssignLead } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import type { Lead } from "@/types";

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

  const leads: Lead[]  = data?.results ?? [];
  const total: number  = data?.count   ?? 0;
  const agents         = agentsData?.results ?? agentsData ?? [];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lead Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          All leads scoped to your organization — assign, route, and track
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by phone, name, city…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-72"
        />
        <span className="text-sm text-gray-400">{total} leads</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Lead", "City / Budget", "Score", "Status", "Intent", "Source", "Agent", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{lead.name ?? lead.phone}</p>
                        {lead.name && <p className="text-xs text-gray-400">{lead.phone}</p>}
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        <p>{lead.location_interest ?? "—"}</p>
                        {lead.budget_max && (
                          <p className="text-gray-400">
                            {lead.budget_max >= 10_000_000
                              ? `${(lead.budget_max / 10_000_000).toFixed(1)} Cr`
                              : `${(lead.budget_max / 100_000).toFixed(0)} L`}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {lead.intent_score !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-14 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (lead.intent_score ?? 0) >= 70 ? "bg-amber-500"
                                  : (lead.intent_score ?? 0) >= 40 ? "bg-blue-400"
                                  : "bg-gray-400"
                                }`}
                                style={{ width: `${lead.intent_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-gray-700">{lead.intent_score}</span>
                          </div>
                        ) : <span className="text-gray-400 text-xs">—</span>}
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
                      <td className="px-5 py-3 text-gray-600 capitalize text-xs">{lead.intent ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 capitalize text-xs">{lead.source ?? "—"}</td>
                      <td className="px-5 py-3 text-xs">
                        {lead.assigned_agent_name ? (
                          <span className="font-medium text-gray-700">{lead.assigned_agent_name}</span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
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
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none"
                          >
                            <option value="">Assign…</option>
                            {agents.map((a: { id: number; name: string }) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => autoMutation.mutate(lead.id)}
                            disabled={autoMutation.isPending}
                            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Auto
                          </button>
                        </div>
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
