"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeads, autoAssignLead, assignAgentToLead, suggestAgentsForLead,
  bulkAssignLeads, getLeadConversations, sendLeadMessage,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatPKR } from "@/lib/utils";
import type { Lead, ConversationMessage } from "@/types";

const PAGE_SIZE = 20;

interface AgentSuggestion {
  id: number;
  name: string;
  phone: string;
  rating: number | null;
  availability_status: string;
}

function ConversationPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["lead-conversations", lead.id],
    queryFn: () => getLeadConversations(lead.id).then((r) => r.data),
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendLeadMessage(lead.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-conversations", lead.id] });
      setMessage("");
    },
  });

  const messages: ConversationMessage[] = data ?? [];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900">{lead.name || "Unknown"}</p>
          <p className="text-xs text-gray-400 font-mono">{lead.phone}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                m.direction === "outbound" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                <p className="leading-snug">{m.body}</p>
                <p className={`text-xs mt-1 ${m.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                  {formatDate(m.created_at)} · {m.channel}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Send a WhatsApp message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                e.preventDefault();
                sendMutation.mutate(message.trim());
              }
            }}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => message.trim() && sendMutation.mutate(message.trim())}
            disabled={sendMutation.isPending || !message.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
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
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">All buyer leads across the platform</p>
        </div>
        <div className="text-sm text-gray-400">
          {data?.count ?? 0} total
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by phone or name..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-32 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === leads.length && leads.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
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
            <tbody className="divide-y divide-gray-50">
              {leads.map((l) => (
                <>
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(l.id)}
                        onChange={() => handleToggleSelect(l.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{l.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400 font-mono">{l.phone}</p>
                      {l.source && (
                        <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          l.source === "whatsapp" ? "bg-green-50 text-green-700"
                          : l.source === "web"    ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-500"
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
                            : "text-gray-400"
                        }`}>
                          {l.intent_score}/10
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {l.budget_max ? formatPKR(l.budget_max) : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {l.location_interest || "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {l.assigned_agent_name || <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={l.status} variant={STATUS_COLOR[l.status] ?? "gray"} />
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(l.created_at)}</td>
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
                          className={`text-xs hover:underline ${assignLeadId === l.id ? "text-gray-500" : "text-purple-600"}`}
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
                          <p className="text-xs text-gray-400">Loading suggested agents…</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-medium text-gray-600">Suggested agents:</span>
                            {suggestions.map((agent) => (
                              <button
                                key={agent.id}
                                onClick={() => assignMutation.mutate({ leadId: l.id, agentId: agent.id })}
                                disabled={assignMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs hover:bg-purple-100 transition-colors disabled:opacity-50"
                              >
                                <span className="font-medium text-gray-800">{agent.name}</span>
                                <span className="text-gray-400">{agent.phone}</span>
                                {agent.rating !== null && (
                                  <span className="text-yellow-500">★ {agent.rating}</span>
                                )}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  agent.availability_status === "available" ? "bg-green-100 text-green-700"
                                  : agent.availability_status === "busy" ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-500"
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
                </>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
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
