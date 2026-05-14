"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLead, updateLead, getLeadConversations, sendLeadMessage,
  getAppointments, createAppointment, confirmAppointment,
  cancelAppointment, getAgentProfile, summarizeLead, suggestReplies,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import type { Lead, ConversationMessage, Appointment, AppointmentStatus, AgentProfile } from "@/types";

const STATUS_OPTIONS = ["new", "warm", "qualified", "cold"] as const;
const STATUS_COLORS: Record<string, "blue" | "yellow" | "green" | "gray"> = {
  new: "blue", warm: "yellow", qualified: "green", cold: "gray",
};
const APPT_COLORS: Record<AppointmentStatus, "green" | "yellow" | "red" | "gray" | "blue"> = {
  scheduled: "yellow", confirmed: "blue", completed: "green", cancelled: "red", rescheduled: "gray",
};

function IntentBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color = score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 tabular-nums w-8 text-right">{score}/10</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [notes, setNotes] = useState("");
  const [notesEditing, setNotesEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);
  const [apptForm, setApptForm] = useState({
    scheduled_at: "", duration_minutes: "60", notes: "",
  });
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => getLead(id).then((r) => r.data as Lead),
    enabled: !!id,
  });

  const { data: profile } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: () => getAgentProfile().then((r) => r.data as AgentProfile),
  });

  const { data: msgData, isLoading: msgsLoading } = useQuery({
    queryKey: ["lead-conversations", id],
    queryFn: () => getLeadConversations(id).then((r) => r.data),
    refetchInterval: 8000,
    enabled: !!id,
  });

  const { data: apptData } = useQuery({
    queryKey: ["lead-appointments", id],
    queryFn: () => getAppointments({ lead: id }).then((r) => r.data),
    enabled: !!id,
  });

  const messages: ConversationMessage[] = msgData ?? [];
  const appointments: Appointment[] = apptData?.results ?? apptData ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: (s: string) => updateLead(id, { status: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });

  const notesMutation = useMutation({
    mutationFn: (n: string) => updateLead(id, { notes: n }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      setNotesEditing(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendLeadMessage(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-conversations", id] });
      setMessage("");
    },
  });

  const bookMutation = useMutation({
    mutationFn: () => createAppointment({
      lead: id,
      agent: profile?.id,
      scheduled_at: apptForm.scheduled_at,
      duration_minutes: Number(apptForm.duration_minutes),
      notes: apptForm.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-appointments", id] });
      setShowBookModal(false);
      setApptForm({ scheduled_at: "", duration_minutes: "60", notes: "" });
    },
  });

  const confirmApptMutation = useMutation({
    mutationFn: (apptId: string) => confirmAppointment(apptId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-appointments", id] }),
  });

  const cancelApptMutation = useMutation({
    mutationFn: (apptId: string) => cancelAppointment(apptId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-appointments", id] }),
  });

  async function handleSummarize() {
    setSummarizing(true);
    setSummary(null);
    try {
      const r = await summarizeLead(id);
      setSummary(r.data.summary);
    } catch {
      setSummary("Could not generate summary — AI unavailable.");
    } finally {
      setSummarizing(false);
    }
  }

  async function handleSuggestReplies() {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const r = await suggestReplies(id);
      setSuggestions(r.data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggesting(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  }
  if (!lead) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-medium">Lead not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">
          ← Back to leads
        </button>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6 pb-10 max-w-6xl">

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Back
        </button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lead.name || lead.phone}</h1>
          <p className="text-sm text-gray-400 font-mono mt-0.5">{lead.phone}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Status:</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                lead.status === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column: info + notes ──────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          <Section title="Lead Information">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Status</span>
                <Badge label={lead.status} variant={STATUS_COLORS[lead.status] ?? "gray"} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Intent</span>
                <span className="text-xs font-medium text-gray-700 capitalize">{lead.intent ?? "—"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Intent Score</span>
                <div className="mt-1">
                  <IntentBar score={lead.intent_score ?? 0} />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Location</span>
                <span className="text-xs font-medium text-gray-700">{lead.location_interest ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Budget Min</span>
                <span className="text-xs font-medium text-gray-700">
                  {lead.budget_min ? formatPKR(lead.budget_min) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Budget Max</span>
                <span className="text-xs font-medium text-gray-700">
                  {lead.budget_max ? formatPKR(lead.budget_max) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Assigned To</span>
                <span className="text-xs font-medium text-gray-700">{lead.assigned_agent_name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Created</span>
                <span className="text-xs text-gray-400">{formatDate(lead.created_at)}</span>
              </div>
            </div>
          </Section>

          <Section title="Notes">
            {notesEditing ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className={inputCls}
                  placeholder="Add internal notes…"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => notesMutation.mutate(notes)}
                    disabled={notesMutation.isPending}
                    className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {notesMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setNotesEditing(false)}
                    className="flex-1 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[60px]">
                  {lead.notes || <span className="text-gray-300">No notes yet</span>}
                </p>
                <button
                  onClick={() => { setNotes(lead.notes || ""); setNotesEditing(true); }}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  {lead.notes ? "Edit notes" : "+ Add note"}
                </button>
              </div>
            )}
          </Section>

          {/* Appointments */}
          <Section title="Appointments">
            <div className="space-y-2 mb-3">
              {appointments.length === 0 ? (
                <p className="text-xs text-gray-400">No appointments booked</p>
              ) : (
                appointments.map((a) => (
                  <div key={a.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge label={a.status} variant={APPT_COLORS[a.status]} />
                      <span className="text-xs text-gray-400">{formatDate(a.scheduled_at)}</span>
                    </div>
                    {a.property_title && (
                      <p className="text-xs text-gray-600">{a.property_title}</p>
                    )}
                    {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                    {a.status === "scheduled" && (
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => confirmApptMutation.mutate(a.id)}
                          className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => cancelApptMutation.mutate(a.id)}
                          className="text-xs px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowBookModal(true)}
              className="w-full py-1.5 text-xs border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              + Book Appointment
            </button>
          </Section>
        </div>

        {/* ── Right column: conversation ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* AI Summary panel */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">AI Summary</h3>
              <button
                onClick={handleSummarize}
                disabled={summarizing || messages.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-40 transition-colors"
              >
                {summarizing ? "Summarizing…" : "✨ Summarize"}
              </button>
            </div>
            {summary ? (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
            ) : (
              <p className="text-sm text-gray-400">
                {messages.length === 0
                  ? "No conversation to summarize yet."
                  : "Click Summarize to get an AI-written overview of this lead's conversation."}
              </p>
            )}
          </div>

          <Section title="WhatsApp Conversation">
            <div className="flex flex-col h-[500px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                {msgsLoading ? (
                  <div className="flex justify-center py-8"><LoadingSpinner /></div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-10">No messages yet</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.direction === "outbound"
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        <p className="leading-snug">{m.body}</p>
                        <p className={`text-xs mt-1 ${m.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                          {m.sender_name
                            ? `${m.sender_name} · ${formatDate(m.created_at)}`
                            : formatDate(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Smart reply suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(s)}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100 transition-colors text-left max-w-full truncate"
                      title={s}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setSuggestions([])}
                    className="rounded-full border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Composer */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                        e.preventDefault();
                        sendMutation.mutate(message.trim());
                      }
                    }}
                    placeholder="Type a WhatsApp message…"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => message.trim() && sendMutation.mutate(message.trim())}
                    disabled={sendMutation.isPending || !message.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    Send
                  </button>
                </div>
                <button
                  onClick={handleSuggestReplies}
                  disabled={suggesting || messages.length === 0}
                  className="text-xs text-purple-600 hover:underline disabled:opacity-40"
                >
                  {suggesting ? "Thinking…" : "✨ Suggest replies"}
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Book appointment modal ─────────────────────────────────────────── */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Book Appointment</h2>
              <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Date & Time</label>
              <input
                type="datetime-local"
                value={apptForm.scheduled_at}
                onChange={(e) => setApptForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (minutes)</label>
              <select
                value={apptForm.duration_minutes}
                onChange={(e) => setApptForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className={inputCls}
              >
                {[30, 60, 90, 120].map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Notes (optional)</label>
              <textarea
                value={apptForm.notes}
                onChange={(e) => setApptForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className={inputCls}
                placeholder="Location, instructions, etc."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => bookMutation.mutate()}
                disabled={bookMutation.isPending || !apptForm.scheduled_at}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {bookMutation.isPending ? "Booking…" : "Book Appointment"}
              </button>
              <button
                onClick={() => setShowBookModal(false)}
                className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
