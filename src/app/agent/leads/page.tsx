"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getLeads, updateLead } from "@/lib/api";
import { ConversationPanel } from "@/components/leads/ConversationPanel";
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
      <div className="w-20 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[var(--text-muted)]">{score}/100</span>
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Leads</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">All leads assigned to you, sorted by intent score</p>
        </div>
        <label htmlFor="agent-leads-search" className="sr-only">Search leads</label>
        <input
          id="agent-leads-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56"
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={statusFilter === s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              statusFilter === s.value
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-muted)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Location / Budget</th>
                <th className="px-6 py-3">Intent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {leads
                .sort((a, b) => (b.intent_score ?? 0) - (a.intent_score ?? 0))
                .map((l) => (
                  <>
                    <tr key={l.id} className="hover:bg-[var(--bg-muted)]">
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
                      <td className="px-6 py-3 text-[var(--text-muted)] text-xs">
                        <p>{l.location_interest || "—"}</p>
                        <p className="text-[var(--text-muted)]">{l.budget_max && l.budget_currency ? formatCurrency(l.budget_max, l.budget_currency) : "—"}</p>
                      </td>
                      <td className="px-6 py-3">
                        {l.intent_score !== null ? (
                          <IntentBar score={l.intent_score} />
                        ) : (
                          <span className="text-[var(--text-faint)] text-xs">Unscored</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => updateMutation.mutate({ id: l.id, data: { status: e.target.value } })}
                          disabled={updateMutation.isPending}
                          className="rounded border border-[var(--border)] text-xs px-2 py-1 text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          {STATUS_OPTS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-[var(--text-muted)] text-xs">{formatDate(l.created_at)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/agent/leads/${l.id}`}
                            className="text-xs text-[var(--text-muted)] hover:underline font-medium"
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
                            aria-label={`Notes for ${l.name || l.phone}`}
                          className="text-xs text-[var(--text-muted)] hover:underline font-medium"
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
                              className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
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
                                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          {l.notes && (
                            <p className="mt-2 text-xs text-[var(--text-muted)] italic">Current: {l.notes}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
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
