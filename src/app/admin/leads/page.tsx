"use client";

import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeads, autoAssignLead, assignAgentToLead, suggestAgentsForLead,
  bulkAssignLeads,
} from "@/lib/api";
import { ConversationPanel } from "@/components/leads/ConversationPanel";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Lead, ConversationMessage } from "@/types";

const PAGE_SIZE = 20;

interface AgentSuggestion {
  id: number;
  name: string;
  phone: string;
  rating: number | null;
  availability_status: string;
}


const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray" | "blue"> = {
  qualified:   "green",
  interested:  "blue",
  new:         "yellow",
  contacted:   "yellow",
  cold:        "gray",
  lost:        "red",
  spam:        "red",
};

export default function AdminLeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [openLead, setOpenLead] = useState<Lead | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [bulkAgentId, setBulkAgentId] = useState<string>("");

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleStatus(v: string) { setStatusFilter(v); setPage(1); }

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads", search, statusFilter, page],
    queryFn: () =>
      getLeads({
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
      }).then((r) => r.data),
  });

  const autoAssignMutation = useMutation({
    mutationFn: (id: string) => autoAssignLead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-leads"] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ leadId, agentId }: { leadId: string; agentId: number }) =>
      assignAgentToLead(leadId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      setAssignLeadId(null);
      setSuggestions([]);
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: ({ leadIds, agentId }: { leadIds: string[]; agentId: number }) =>
      bulkAssignLeads(leadIds, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      setSelectedIds(new Set());
      setBulkAgentId("");
    },
  });

  const leads: Lead[] = data?.results ?? [];

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === leads.length && leads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  }

  async function openAssign(leadId: string) {
    if (assignLeadId === leadId) {
      setAssignLeadId(null);
      setSuggestions([]);
      return;
    }
    setAssignLeadId(leadId);
    setSuggestions([]);
    try {
      const res = await suggestAgentsForLead(leadId);
      setSuggestions(res.data ?? []);
    } catch {
      setSuggestions([]);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leads</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">All buyer leads across the platform</p>
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          {data?.count ?? 0} total
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <label htmlFor="admin-leads-search" className="sr-only">Search leads</label>
        <input
          id="admin-leads-search"
          type="text"
          placeholder="Search by phone or name…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {["new", "contacted", "interested", "qualified", "cold", "lost", "spam"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Bulk assign toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">{selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="number"
              placeholder="Agent ID"
              value={bulkAgentId}
              onChange={(e) => setBulkAgentId(e.target.value)}
              className="w-32 rounded-lg border border-blue-200 bg-[var(--bg-surface)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const id = Number(bulkAgentId);
                if (id) bulkAssignMutation.mutate({ leadIds: Array.from(selectedIds), agentId: id });
              }}
              disabled={!bulkAgentId || bulkAssignMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkAssignMutation.isPending ? "Assigning…" : "Bulk Assign"}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-blue-500 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all leads"
                    checked={selectedIds.size === leads.length && leads.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-[var(--border-strong)]"
                  />
                </th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Intent</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Assigned To</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
                <th className="px-6 py-3">CRM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {leads.map((l) => (
                <Fragment key={l.id}>
                  <tr className="hover:bg-[var(--bg-muted)]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select lead ${l.name || l.phone}`}
                        checked={selectedIds.has(l.id)}
                        onChange={() => handleToggleSelect(l.id)}
                        className="rounded border-[var(--border-strong)]"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{l.name || "Unknown"}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{l.phone}</p>
                      {l.source && (
                        <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          l.source === "whatsapp" ? "bg-green-50 text-green-700"
                          : l.source === "web"    ? "bg-blue-50 text-blue-700"
                          : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                        }`}>
                          {l.source}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {l.intent_score !== null ? (
                        <span className={`font-bold text-sm ${
                          (l.intent_score ?? 0) >= 7 ? "text-green-600"
                            : (l.intent_score ?? 0) >= 4 ? "text-yellow-600"
                            : "text-[var(--text-muted)]"
                        }`}>
                          {l.intent_score}/10
                        </span>
                      ) : (
                        <span className="text-[var(--text-faint)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">
                      {l.budget_max && l.budget_currency ? formatCurrency(l.budget_max, l.budget_currency) : "—"}
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">
                      {l.location_interest || "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-[var(--text-muted)]">
                      {l.assigned_agent_name || <span className="text-[var(--text-faint)]">Unassigned</span>}
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={l.status} variant={STATUS_COLOR[l.status] ?? "gray"} />
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)] text-xs">{formatDate(l.created_at)}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-2">
                        {!l.assigned_agent_name && (
                          <button
                            onClick={() => autoAssignMutation.mutate(l.id)}
                            disabled={autoAssignMutation.isPending}
                            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                          >
                            Auto-assign
                          </button>
                        )}
                        <button
                          onClick={() => openAssign(l.id)}
                          className={`text-xs hover:underline ${assignLeadId === l.id ? "text-[var(--text-muted)]" : "text-purple-600"}`}
                        >
                          {assignLeadId === l.id ? "Close" : "Assign"}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setOpenLead(l)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Chat
                      </button>
                    </td>
                  </tr>
                  {assignLeadId === l.id && (
                    <tr key={`${l.id}-assign`} className="bg-purple-50">
                      <td colSpan={10} className="px-6 py-3">
                        {suggestions.length === 0 ? (
                          <p className="text-xs text-[var(--text-muted)]">Loading suggested agents…</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-medium text-[var(--text-muted)]">Suggested agents:</span>
                            {suggestions.map((agent) => (
                              <button
                                key={agent.id}
                                onClick={() => assignMutation.mutate({ leadId: l.id, agentId: agent.id })}
                                disabled={assignMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-[var(--bg-surface)] px-3 py-1.5 text-xs hover:bg-purple-100 transition-colors disabled:opacity-50"
                              >
                                <span className="font-medium text-[var(--text-primary)]">{agent.name}</span>
                                <span className="text-[var(--text-muted)]">{agent.phone}</span>
                                {agent.rating !== null && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-500"><Star size={11} className="fill-amber-400" aria-hidden="true" />{agent.rating}</span>
                                )}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  agent.availability_status === "available" ? "bg-green-100 text-green-700"
                                  : agent.availability_status === "busy" ? "bg-yellow-100 text-yellow-700"
                                  : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                                }`}>
                                  {agent.availability_status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-6 pb-4">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data?.count ?? 0}
              onPage={setPage}
            />
          </div>
        </div>
      )}

      {openLead && (
        <ConversationPanel lead={openLead} onClose={() => setOpenLead(null)} />
      )}
    </div>
  );
}
