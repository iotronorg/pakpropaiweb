"use client";
import { X } from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments, createAppointment,
  confirmAppointment, cancelAppointment, completeAppointment,
  rescheduleAppointment,
  getLeads, getAgentsList,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import type { Appointment, AppointmentStatus, Lead } from "@/types";

const STATUS_COLOR: Record<AppointmentStatus, "green" | "yellow" | "red" | "gray" | "blue"> = {
  scheduled:   "yellow",
  confirmed:   "blue",
  completed:   "green",
  cancelled:   "red",
  rescheduled: "gray",
};

const inputCls = "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// ── Lead search dropdown ───────────────────────────────────────────────────────

function LeadPicker({ value, label, onChange }: {
  value: string;
  label: string;
  onChange: (id: string, display: string) => void;
}) {
  const [query, setQuery] = useState(label);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["lead-search", query],
    queryFn: () => getLeads({ search: query, limit: 8 }).then((r) => r.data),
    enabled: query.length >= 3 && !value,
  });

  const leads: Lead[] = data?.results ?? [];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(l: Lead) {
    onChange(l.id, `${l.name || "Unknown"} — ${l.phone}`);
    setQuery(`${l.name || "Unknown"} — ${l.phone}`);
    setOpen(false);
  }

  function clear() {
    onChange("", "");
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Search by phone or name..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button type="button" onClick={clear} aria-label="Clear filter" className="text-[var(--text-muted)] hover:text-red-500 transition-colors"><X size={14} aria-hidden="true" /></button>
        )}
      </div>
      {open && leads.length > 0 && !value && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg">
          {leads.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => select(l)}
              className="w-full text-start px-3 py-2.5 text-sm hover:bg-[var(--bg-muted)] border-b border-[var(--border-subtle)] last:border-0"
            >
              <span className="font-medium text-[var(--text-primary)]">{l.name || "Unknown"}</span>
              <span className="ms-2 font-mono text-xs text-[var(--text-muted)]">{l.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create modal ───────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [leadId, setLeadId]     = useState("");
  const [leadLabel, setLeadLabel] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [agentId, setAgentId]   = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes]       = useState("");
  const [error, setError]       = useState("");

  const { data: agentsData } = useQuery({
    queryKey: ["agents-list-mini"],
    queryFn: () => getAgentsList().then((r) => r.data),
  });
  const agents = agentsData?.results ?? agentsData ?? [];

  const createMutation = useMutation({
    mutationFn: () => createAppointment({
      lead:             leadId,
      ...(propertyId   ? { property: propertyId } : {}),
      ...(agentId      ? { agent: Number(agentId) } : {}),
      scheduled_at:    new Date(scheduledAt).toISOString(),
      duration_minutes: Number(duration),
      ...(notes ? { notes } : {}),
    }),
    onSuccess: () => { onCreated(); onClose(); },
    onError: (e: unknown) => {
      const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const first = d ? Object.values(d)[0] : null;
      setError(Array.isArray(first) ? String(first[0]) : "Failed to create appointment.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="book-appt-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 id="book-appt-title" className="font-semibold text-[var(--text-primary)]">Book Appointment</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Lead <span className="text-red-500">*</span></label>
            <LeadPicker
              value={leadId}
              label={leadLabel}
              onChange={(id, lbl) => { setLeadId(id); setLeadLabel(lbl); }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Property ID (UUID, optional)</label>
            <input
              className={inputCls}
              placeholder="e.g. 550e8400-e29b-41d4-a716..."
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Assign Agent (optional)</label>
            <select
              className={inputCls}
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="">— No agent —</option>
              {agents.map((a: { id: number; name: string; phone: string }) => (
                <option key={a.id} value={a.id}>#{a.id} — {a.name} ({a.phone})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Scheduled At <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                className={inputCls}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Duration (minutes)</label>
              <select className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)}>
                {["30", "45", "60", "90", "120"].map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Notes</label>
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Optional notes about this visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!leadId || !scheduledAt || createMutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Booking…" : "Book Appointment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-appointments", statusFilter],
    queryFn: () =>
      getAppointments(statusFilter ? { status: statusFilter } : undefined).then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      rescheduleAppointment(id, new Date(scheduledAt).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      setRescheduleId(null);
      setRescheduleAt("");
    },
  });

  const appointments: Appointment[] = data?.results ?? data ?? [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Appointments</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">All property visits and meetings</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Book Appointment
        </button>
      </div>

      <div className="mb-6">
        <label className="sr-only" htmlFor="appt-status-filter">Filter by status</label>
        <select
          id="appt-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {["scheduled", "confirmed", "completed", "cancelled", "rescheduled"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-6 py-3">Lead</th>
                <th className="px-6 py-3">Property</th>
                <th className="px-6 py-3">Agent</th>
                <th className="px-6 py-3">Scheduled At</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--bg-muted)]">
                  <td className="px-6 py-3">
                    {a.lead_name && <p className="text-sm font-medium text-[var(--text-primary)]">{a.lead_name}</p>}
                    <p className="font-mono text-xs text-[var(--text-muted)]">{a.lead_phone}</p>
                  </td>
                  <td className="px-6 py-3 text-[var(--text-muted)]">
                    {a.property_title || <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                  <td className="px-6 py-3 text-[var(--text-muted)]">
                    {a.agent_name || <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                  <td className="px-6 py-3 text-[var(--text-muted)]">{formatDate(a.scheduled_at)}</td>
                  <td className="px-6 py-3 text-[var(--text-muted)]">{a.duration_minutes} min</td>
                  <td className="px-6 py-3">
                    <Badge label={a.status} variant={STATUS_COLOR[a.status]} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      {a.status === "scheduled" && (
                        <button type="button" onClick={() => confirmMutation.mutate(a.id)} disabled={confirmMutation.isPending} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                          Confirm
                        </button>
                      )}
                      {a.status === "confirmed" && (
                        <button type="button" onClick={() => completeMutation.mutate(a.id)} disabled={completeMutation.isPending} className="text-xs text-green-600 hover:underline disabled:opacity-50">
                          Complete
                        </button>
                      )}
                      {["scheduled", "confirmed"].includes(a.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm("Cancel this appointment?")) return;
                              cancelMutation.mutate(a.id);
                            }}
                            disabled={cancelMutation.isPending}
                            className="text-xs text-red-500 hover:underline disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          {rescheduleId === a.id ? (
                            <div className="flex items-center gap-1">
                              <label className="sr-only" htmlFor={`reschedule-${a.id}`}>New date/time</label>
                              <input
                                id={`reschedule-${a.id}`}
                                type="datetime-local"
                                value={rescheduleAt}
                                onChange={(e) => setRescheduleAt(e.target.value)}
                                className="rounded border border-[var(--border)] px-1.5 py-1 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => rescheduleMutation.mutate({ id: a.id, scheduledAt: rescheduleAt })}
                                disabled={!rescheduleAt || rescheduleMutation.isPending}
                                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                aria-label="Cancel reschedule"
                                onClick={() => { setRescheduleId(null); setRescheduleAt(""); }}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              >
                                <X size={12} aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setRescheduleId(a.id); setRescheduleAt(""); }}
                              className="text-xs text-yellow-600 hover:underline"
                            >
                              Reschedule
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["admin-appointments"] })}
        />
      )}
    </div>
  );
}
