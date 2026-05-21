"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLead, updateLead, getLeadActivities, getLeadScoreHistory,
  getLeadConversations, suggestAgentsForLead, autoAssignLead,
  assignAgentToLead, summarizeLead, sendLeadMessage,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Lead, ConversationMessage, AgentProfile } from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 70 ? "#f59e0b" : s >= 40 ? "#60a5fa" : "#9ca3af";
  const r = 28, circ = 2 * Math.PI * r;
  const filled = (s / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xl font-bold tabular-nums -mt-12 z-10 relative" style={{ color }}>
        {score ?? "—"}
      </span>
      <span className="text-xs text-gray-400 mt-8">Intent score</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "green" | "yellow" | "gray" | "blue" | "red"> = {
    qualified: "green", warm: "yellow", cold: "gray", new: "blue", closed: "red",
  };
  return <Badge label={status} variant={map[status] ?? "gray"} />;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

function fmtBudget(min: number | null, max: number | null, currency: string | null) {
  const fmt = (n: number) =>
    n >= 10_000_000 ? `${(n / 10_000_000).toFixed(1)} Cr` : `${(n / 100_000).toFixed(0)} L`;
  const cur = currency ?? "PKR";
  if (min && max) return `${cur} ${fmt(min)} – ${fmt(max)}`;
  if (max) return `${cur} up to ${fmt(max)}`;
  if (min) return `${cur} from ${fmt(min)}`;
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
      <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
        ← Back to leads
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-6">
        <ScoreGauge score={lead.intent_score} />

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{lead.name ?? lead.phone}</h1>
            <StatusBadge status={lead.status} />
            {lead.priority && (
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 capitalize">
                {lead.priority}
              </span>
            )}
            {lead.routing_state && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 uppercase tracking-wide">
                {lead.routing_state}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1 text-sm text-gray-600">
            {lead.name && <p><span className="text-gray-400">Phone</span> {lead.phone}</p>}
            <p><span className="text-gray-400">Intent</span> {lead.intent ?? "—"}</p>
            <p><span className="text-gray-400">Source</span> {lead.source ?? "—"}</p>
            <p><span className="text-gray-400">City</span> {lead.location_interest ?? "—"}</p>
            <p><span className="text-gray-400">Budget</span> {fmtBudget(lead.budget_min, lead.budget_max, lead.budget_currency)}</p>
            <p><span className="text-gray-400">Last contact</span> {fmtDate(lead.last_contacted_at)}</p>
            <p><span className="text-gray-400">Created</span> {fmtDate(lead.created_at)}</p>
            <p>
              <span className="text-gray-400">Agent</span>{" "}
              {lead.assigned_agent_name ?? <span className="italic text-gray-400">Unassigned</span>}
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
                className="text-sm border border-gray-200 rounded px-2 py-1 flex-1"
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
              className="text-xs text-blue-600 hover:underline text-left"
            >Edit status</button>
          )}
        </div>
      </div>

      {/* Intent signals */}
      {signals && Object.keys(signals).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Intent Signals</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(signals).map(([k, v]) => (
              <div key={k} className="flex flex-col items-start rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs min-w-[100px]">
                <span className="text-gray-400 uppercase tracking-wide text-[10px]">{k.replace(/_/g, " ")}</span>
                <span className="font-semibold text-gray-800 mt-0.5">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: tabs */}
        <div className="lg:col-span-2 space-y-4">

          {/* Notes */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
              {notesEdit === null
                ? <button onClick={() => setNotesEdit(lead.notes ?? "")} className="text-xs text-blue-600 hover:underline">Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setNotesEdit(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
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
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              : <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes || <span className="italic text-gray-300">No notes</span>}</p>
            }
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
            {(["activity", "conversations", "score"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
                  activeTab === t
                    ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "score" ? "Score history" : t}
              </button>
            ))}
          </div>

          {/* Activity feed */}
          {activeTab === "activity" && (
            <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
              {(activities as Array<{ id: string; action: string; notes: string; actor_name: string | null; created_at: string }>).length === 0
                ? <p className="py-10 text-center text-sm text-gray-400">No activity yet</p>
                : (activities as Array<{ id: string; action: string; notes: string; actor_name: string | null; created_at: string }>).map((a) => (
                    <div key={a.id} className="flex gap-3 px-5 py-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-medium text-gray-800 capitalize">{a.action.replace(/_/g, " ")}</span>
                        {a.notes && <span className="text-gray-500"> — {a.notes}</span>}
                        <p className="text-xs text-gray-400 mt-0.5">
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
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {conversations.length === 0
                  ? <p className="py-10 text-center text-sm text-gray-400">No messages yet</p>
                  : conversations.map((m) => (
                      <div key={m.id} className={`px-5 py-3 ${m.direction === "inbound" ? "" : "bg-blue-50/50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {m.direction === "inbound" ? (m.sender_name ?? m.sender_phone ?? "Client") : "Agent"}
                          </span>
                          <span className="text-xs text-gray-400">{fmtDate(m.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))
                }
              </div>
              {/* Reply box */}
              <div className="border-t border-gray-100 px-5 py-4 flex gap-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={2}
                  placeholder="Send a WhatsApp message…"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
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
            <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
              {(scoreHistory as Array<{ id: string; old_score: number; new_score: number; reason: string; changed_by_phone: string | null; created_at: string }>).length === 0
                ? <p className="py-10 text-center text-sm text-gray-400">No score history yet</p>
                : (scoreHistory as Array<{ id: string; old_score: number; new_score: number; reason: string; changed_by_phone: string | null; created_at: string }>).map((h) => (
                    <div key={h.id} className="px-5 py-3 flex items-center gap-4 text-sm">
                      <div className="tabular-nums flex items-center gap-1">
                        <span className="text-gray-400">{h.old_score}</span>
                        <span className="text-gray-300">→</span>
                        <span className={`font-bold ${h.new_score > h.old_score ? "text-green-600" : "text-red-500"}`}>{h.new_score}</span>
                      </div>
                      <p className="flex-1 text-gray-600">{h.reason || "—"}</p>
                      <p className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(h.created_at)}</p>
                    </div>
                  ))
              }
            </div>
          )}

          {/* AI summary */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">AI Summary</h2>
              <button
                onClick={() => summaryMutation.mutate()}
                disabled={summaryMutation.isPending}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
              >
                {summaryMutation.isPending ? "Generating…" : "Generate"}
              </button>
            </div>
            {summaryMutation.data
              ? <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {(summaryMutation.data as { data: { summary: string } }).data.summary}
                </p>
              : <p className="text-sm italic text-gray-300">Click Generate to get an AI-written summary of this lead&apos;s conversation.</p>
            }
          </div>
        </div>

        {/* Right: agent suggestions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Agent Suggestions</h2>
            {suggestedAgents.length === 0
              ? <p className="text-sm text-gray-400 italic">No suitable agents found</p>
              : suggestedAgents.map((a, i) => (
                  <div key={a.id} className="mb-3 last:mb-0 flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.cities?.join(", ") || "—"}</p>
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
        </div>

      </div>
    </div>
  );
}
