"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLead, updateLead, getLeadActivities, getLeadScoreHistory,
  getLeadConversations, suggestAgentsForLead, autoAssignLead,
  assignAgentToLead, summarizeLead, sendLeadMessage,
  getRecommendedProperties,
} from "@/lib/api";
import { formatDate as fmtDateUtil } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Lead, ConversationMessage, AgentProfile, Property } from "@/types";
import { ArrowLeft } from "lucide-react";
import { ScoreGauge } from "@/components/leads/ScoreGauge";
import { ScoreFactorBars } from "@/components/leads/ScoreFactorBars";

// ── helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "green" | "yellow" | "gray" | "blue" | "red"> = {
    qualified: "green", warm: "yellow", cold: "gray", new: "blue", closed: "red",
  };
  return <Badge label={status} variant={map[status] ?? "gray"} />;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

function fmtBudget(min: number | null, max: number | null, currency: string | null) {
  const cur = currency ?? "PKR";
  if (min && max) return `${formatCurrency(min, cur)} – ${formatCurrency(max, cur)}`;
  if (max) return `up to ${formatCurrency(max, cur)}`;
  if (min) return `from ${formatCurrency(min, cur)}`;
  return "—";
}

// ── main component ────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"activity" | "conversations" | "score">("activity");
  const [replyBody, setReplyBody] = useState("");
  const [statusEdit, setStatusEdit] = useState<string | null>(null);
  const [notesEdit, setNotesEdit] = useState<string | null>(null);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["lead", id],
    queryFn: () => getLead(id).then((r) => r.data),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["lead-activities", id],
    queryFn: () => getLeadActivities(id).then((r) => r.data),
    enabled: activeTab === "activity",
  });

  const { data: conversations = [] } = useQuery<ConversationMessage[]>({
    queryKey: ["lead-conversations", id],
    queryFn: () => getLeadConversations(id).then((r) => r.data),
    enabled: activeTab === "conversations",
  });

  const { data: scoreHistory = [] } = useQuery({
    queryKey: ["lead-score-history", id],
    queryFn: () => getLeadScoreHistory(id).then((r) => r.data),
    enabled: activeTab === "score",
  });

  const { data: suggestedAgents = [] } = useQuery<AgentProfile[]>({
    queryKey: ["lead-agents", id],
    queryFn: () => suggestAgentsForLead(id).then((r) => r.data),
    enabled: !!lead,
  });

  const { data: recommendedProps = [] } = useQuery<Property[]>({
    queryKey: ["lead-recommended-props", id],
    queryFn: () => getRecommendedProperties(id).then((r) => r.data),
    enabled: !!lead,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateLead(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["org-leads"] });
      setStatusEdit(null);
      setNotesEdit(null);
    },
  });

  const autoMutation = useMutation({
    mutationFn: () => autoAssignLead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["lead-activities", id] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (agentId: number) => assignAgentToLead(id, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["lead-activities", id] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => sendLeadMessage(id, body),
    onSuccess: () => {
      setReplyBody("");
      qc.invalidateQueries({ queryKey: ["lead-conversations", id] });
    },
  });

  const summaryMutation = useMutation({
    mutationFn: () => summarizeLead(id),
  });

  if (isLoading || !lead) {
    return (
      <div className="flex items-center justify-center py-40">
        <LoadingSpinner />
      </div>
    );
  }

  const signals = lead.intent_signals as Record<string, unknown> | null;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">

      {/* Back */}
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft size={14} aria-hidden="true" /> Back to leads
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex flex-col items-center gap-3">
          <ScoreGauge score={lead.intent_score} />
          <ScoreFactorBars factors={lead.score_factors ?? null} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{lead.name ?? lead.phone}</h1>
            <StatusBadge status={lead.status} />
            {lead.priority && (
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 capitalize">
                {lead.priority}
              </span>
            )}
            {lead.routing_state && (
              <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs text-[var(--text-muted)] uppercase tracking-wide">
                {lead.routing_state}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1 text-sm text-[var(--text-muted)]">
            {lead.name && <p><span className="text-[var(--text-muted)]">Phone</span> {lead.phone}</p>}
            <p><span className="text-[var(--text-muted)]">Intent</span> {lead.intent ?? "—"}</p>
            <p><span className="text-[var(--text-muted)]">Source</span> {lead.source ?? "—"}</p>
            <p><span className="text-[var(--text-muted)]">City</span> {lead.location_interest ?? "—"}</p>
            <p><span className="text-[var(--text-muted)]">Budget</span> {fmtBudget(lead.budget_min, lead.budget_max, lead.budget_currency)}</p>
            <p><span className="text-[var(--text-muted)]">Last contact</span> {fmtDate(lead.last_contacted_at)}</p>
            <p><span className="text-[var(--text-muted)]">Created</span> {fmtDate(lead.created_at)}</p>
            <p>
              <span className="text-[var(--text-muted)]">Agent</span>{" "}
              {lead.assigned_agent_name ?? <span className="italic text-[var(--text-muted)]">Unassigned</span>}
            </p>
          </div>
        </div>

        {/* Quick-edit status + notes */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          {statusEdit !== null ? (
            <div className="flex gap-2">
              <select
                value={statusEdit}
                onChange={(e) => setStatusEdit(e.target.value)}
                className="text-sm border border-[var(--border)] rounded px-2 py-1 flex-1"
              >
                {["new", "warm", "qualified", "cold", "closed"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => saveMutation.mutate({ status: statusEdit })}
                disabled={saveMutation.isPending}
                className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >Save</button>
            </div>
          ) : (
            <button
              onClick={() => setStatusEdit(lead.status)}
              className="text-xs text-blue-600 hover:underline text-start"
            >Edit status</button>
          )}
        </div>
      </div>

      {/* Intent signals */}
      {signals && Object.keys(signals).length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Intent Signals</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(signals).map(([k, v]) => (
              <div key={k} className="flex flex-col items-start rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] px-3 py-2 text-xs min-w-[100px]">
                <span className="text-[var(--text-muted)] uppercase tracking-wide text-[10px]">{k.replace(/_/g, " ")}</span>
                <span className="font-semibold text-[var(--text-primary)] mt-0.5">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: tabs */}
        <div className="lg:col-span-2 space-y-4">

          {/* Notes */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-muted)]">Notes</h2>
              {notesEdit === null
                ? <button onClick={() => setNotesEdit(lead.notes ?? "")} className="text-xs text-blue-600 hover:underline">Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setNotesEdit(null)} className="text-xs text-[var(--text-muted)] hover:underline">Cancel</button>
                    <button
                      onClick={() => saveMutation.mutate({ notes: notesEdit })}
                      disabled={saveMutation.isPending}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >Save</button>
                  </div>
              }
            </div>
            {notesEdit !== null
              ? <textarea
                  value={notesEdit}
                  onChange={(e) => setNotesEdit(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              : <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{lead.notes || <span className="italic text-[var(--text-faint)]">No notes</span>}</p>
            }
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-1 w-fit">
            {(["activity", "conversations", "score"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={activeTab === t}
                onClick={() => setActiveTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
                  activeTab === t
                    ? "bg-[var(--bg-surface)] text-blue-600 shadow-sm border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-muted)]"
                }`}
              >
                {t === "score" ? "Score history" : t}
              </button>
            ))}
          </div>

          {/* Activity feed */}
          {activeTab === "activity" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] divide-y divide-[var(--border)]">
              {(activities as Array<{ id: string; action: string; notes: string; actor_name: string | null; created_at: string }>).length === 0
                ? <p className="py-10 text-center text-sm text-[var(--text-muted)]">No activity yet</p>
                : (activities as Array<{ id: string; action: string; notes: string; actor_name: string | null; created_at: string }>).map((a) => (
                    <div key={a.id} className="flex gap-3 px-5 py-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-medium text-[var(--text-primary)] capitalize">{a.action.replace(/_/g, " ")}</span>
                        {a.notes && <span className="text-[var(--text-muted)]"> — {a.notes}</span>}
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {a.actor_name ?? "System"} · {fmtDate(a.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}

          {/* Conversations */}
          {activeTab === "conversations" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                {conversations.length === 0
                  ? <p className="py-10 text-center text-sm text-[var(--text-muted)]">No messages yet</p>
                  : conversations.map((m) => (
                      <div key={m.id} className={`px-5 py-3 ${m.direction === "inbound" ? "" : "bg-blue-50/50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--text-muted)]">
                            {m.direction === "inbound" ? (m.sender_name ?? m.sender_phone ?? "Client") : "Agent"}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">{fmtDate(m.created_at)}</span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))
                }
              </div>
              {/* Reply box */}
              <div className="border-t border-[var(--border)] px-5 py-4 flex gap-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={2}
                  placeholder="Send a WhatsApp message…"
                  className="flex-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
                <button
                  onClick={() => replyBody.trim() && replyMutation.mutate(replyBody.trim())}
                  disabled={replyMutation.isPending || !replyBody.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 self-end"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Score history */}
          {activeTab === "score" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] divide-y divide-[var(--border)]">
              {(scoreHistory as Array<{ id: string; old_score: number; new_score: number; reason: string; changed_by_phone: string | null; created_at: string }>).length === 0
                ? <p className="py-10 text-center text-sm text-[var(--text-muted)]">No score history yet</p>
                : (scoreHistory as Array<{ id: string; old_score: number; new_score: number; reason: string; changed_by_phone: string | null; created_at: string }>).map((h) => (
                    <div key={h.id} className="px-5 py-3 flex items-center gap-4 text-sm">
                      <div className="tabular-nums flex items-center gap-1">
                        <span className="text-[var(--text-muted)]">{h.old_score}</span>
                        <span className="text-[var(--text-faint)]">→</span>
                        <span className={`font-bold ${h.new_score > h.old_score ? "text-green-600" : "text-red-500"}`}>{h.new_score}</span>
                      </div>
                      <p className="flex-1 text-[var(--text-muted)]">{h.reason || "—"}</p>
                      <p className="text-xs text-[var(--text-muted)] whitespace-nowrap">{fmtDate(h.created_at)}</p>
                    </div>
                  ))
              }
            </div>
          )}

          {/* AI summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-muted)]">AI Summary</h2>
              <button
                onClick={() => summaryMutation.mutate()}
                disabled={summaryMutation.isPending}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
              >
                {summaryMutation.isPending ? "Generating…" : "Generate"}
              </button>
            </div>
            {summaryMutation.data
              ? <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
                  {(summaryMutation.data as { data: { summary: string } }).data.summary}
                </p>
              : <p className="text-sm italic text-[var(--text-faint)]">Click Generate to get an AI-written summary of this lead&apos;s conversation.</p>
            }
          </div>
        </div>

        {/* Right: agent suggestions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-5">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Agent Suggestions</h2>
            {suggestedAgents.length === 0
              ? <p className="text-sm text-[var(--text-muted)] italic">No suitable agents found</p>
              : suggestedAgents.map((a, i) => (
                  <div key={a.id} className="mb-3 last:mb-0 flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)]">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{a.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{a.cities?.join(", ") || "—"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {a.rating != null && (
                          <span className="text-xs text-amber-600 font-medium">★ {a.rating}</span>
                        )}
                        {a.is_verified && (
                          <span className="text-xs text-green-600 font-medium">Verified</span>
                        )}
                        {a.is_featured && (
                          <span className="text-xs text-purple-600 font-medium">Featured</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => assignMutation.mutate(a.id)}
                      disabled={assignMutation.isPending}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                    >
                      Assign
                    </button>
                  </div>
                ))
            }
            <button
              onClick={() => autoMutation.mutate()}
              disabled={autoMutation.isPending}
              className="mt-4 w-full text-sm py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {autoMutation.isPending ? "Assigning…" : "Auto-assign best match"}
            </button>
          </div>

          {/* Recommended Properties */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-5">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Recommended Properties</h2>
            {recommendedProps.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">
                {lead.location_interest || lead.budget_max
                  ? "No matching properties found"
                  : "Set city or budget on this lead to get recommendations"}
              </p>
            ) : (
              recommendedProps.map((p) => (
                <div
                  key={p.id}
                  className="mb-3 last:mb-0 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-3 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2">{p.title}</p>
                    {p.ai_score != null && (
                      <span className={`flex-shrink-0 text-xs font-bold rounded-full px-2 py-0.5 ${
                        p.ai_score >= 70 ? "bg-green-100 text-green-700"
                          : p.ai_score >= 40 ? "bg-yellow-100 text-yellow-700"
                          : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                      }`}>
                        {p.ai_score}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {p.city}{p.location ? ` · ${p.location}` : ""} · {p.property_type}
                  </p>
                  {p.price != null && (
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                      {(p as Property & { currency?: string }).currency ?? "PKR"}{" "}
                      {p.price >= 10_000_000
                        ? `${(p.price / 10_000_000).toFixed(1)} Cr`
                        : p.price >= 100_000
                        ? `${(p.price / 100_000).toFixed(0)} L`
                        : p.price.toLocaleString()}
                    </p>
                  )}
                  <a
                    href={`/organization/inventory?highlight=${p.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View in inventory →
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
