"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getLeads, getLeadConversations, sendLeadMessage, updateLead } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Lead, ConversationMessage } from "@/types";

function IntentBar({ score }: { score: number }) {
  const pct = score;
  const color =
    score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}/100</span>
    </div>
  );
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
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900">{lead.name || "Unknown"}</p>
          <p className="text-xs text-gray-400 font-mono">{lead.phone}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.direction === "outbound"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                <p className="leading-snug">{m.body}</p>
                <p className={`text-xs mt-1 ${m.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                  {formatDate(m.created_at)}
                  {m.channel === "whatsapp" ? " · WhatsApp" : " · Dashboard"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send */}
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
        {sendMutation.isError && (
          <p className="mt-1 text-xs text-red-500">Failed to send message</p>
        )}
      </div>
    </div>
  );
}

const STATUSES = [
  { value: "",            label: "All" },
  { value: "new",         label: "New" },
  { value: "contacted",   label: "Contacted" },
  { value: "interested",  label: "Interested" },
  { value: "qualified",   label: "Qualified" },
  { value: "negotiating", label: "Negotiating" },
  { value: "closed_won",  label: "Won" },
  { value: "closed_lost", label: "Lost" },
  { value: "spam",        label: "Spam" },
];

const STATUS_OPTS = STATUSES.filter((s) => s.value !== "");

export default function AgentLeadsPage() {
  const qc = useQueryClient();
  const [openLead, setOpenLead]       = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]             = useState("");
  const [expandNotes, setExpandNotes]   = useState<string | null>(null);
  const [noteDraft, setNoteDraft]       = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["agent-leads-full", statusFilter, search],
    queryFn: () => getLeads({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search       ? { search }              : {}),
    }).then((r) => r.data).catch(() => ({ results: [] })),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateLead(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-leads-full"] }),
  });

  const leads: Lead[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
          <p className="mt-1 text-sm text-gray-500">All leads assigned to you, sorted by intent score</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56"
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              statusFilter === s.value
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-start text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Location / Budget</th>
                <th className="px-6 py-3">Intent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads
                .sort((a, b) => (b.intent_score ?? 0) - (a.intent_score ?? 0))
                .map((l) => (
                  <>
                    <tr key={l.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-3 text-gray-600 text-xs">
                        <p>{l.location_interest || "—"}</p>
                        <p className="text-gray-400">{l.budget_max ? formatCurrency(l.budget_max, l.budget_currency ?? "PKR") : "Budget unknown"}</p>
                      </td>
                      <td className="px-6 py-3">
                        {l.intent_score !== null ? (
                          <IntentBar score={l.intent_score} />
                        ) : (
                          <span className="text-gray-300 text-xs">Unscored</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => updateMutation.mutate({ id: l.id, data: { status: e.target.value } })}
                          disabled={updateMutation.isPending}
                          className="rounded border border-gray-200 text-xs px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          {STATUS_OPTS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(l.created_at)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/agent/leads/${l.id}`}
                            className="text-xs text-gray-600 hover:underline font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => setOpenLead(l)}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Chat
                          </button>
                          <button
                            onClick={() => {
                              if (expandNotes === l.id) {
                                setExpandNotes(null);
                              } else {
                                setExpandNotes(l.id);
                                setNoteDraft(l.notes ?? "");
                              }
                            }}
                            className="text-xs text-gray-500 hover:underline font-medium"
                          >
                            Notes
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandNotes === l.id && (
                      <tr key={`${l.id}-notes`} className="bg-amber-50">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="flex items-start gap-3">
                            <textarea
                              rows={2}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Add notes about this lead…"
                              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            />
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => {
                                  updateMutation.mutate({ id: l.id, data: { notes: noteDraft } });
                                  setExpandNotes(null);
                                }}
                                disabled={updateMutation.isPending}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setExpandNotes(null)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          {l.notes && (
                            <p className="mt-2 text-xs text-gray-500 italic">Current: {l.notes}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {statusFilter || search ? "No leads match your filter" : "No leads yet — they appear here when buyers connect via WhatsApp"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {openLead && (
        <ConversationPanel lead={openLead} onClose={() => setOpenLead(null)} />
      )}
    </div>
  );
}
