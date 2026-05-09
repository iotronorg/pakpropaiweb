"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments, createAppointment,
  confirmAppointment, cancelAppointment, completeAppointment,
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

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

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
          <button onClick={clear} className="text-gray-400 hover:text-red-500 text-lg leading-none px-1">×</button>
        )}
      </div>
      {open && leads.length > 0 && !value && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {leads.map((l) => (
            <button
              key={l.id}
              onClick={() => select(l)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
            >
              <span className="font-medium text-gray-800">{l.name || "Unknown"}</span>
              <span className="ml-2 font-mono text-xs text-gray-400">{l.phone}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Book Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lead <span className="text-red-500">*</span></label>
            <LeadPicker
              value={leadId}
              label={leadLabel}
              onChange={(id, lbl) => { setLeadId(id); setLeadLabel(lbl); }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Property ID (UUID, optional)</label>
            <input
              className={inputCls}
              placeholder="e.g. 550e8400-e29b-41d4-a716..."
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assign Agent (optional)</label>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled At <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                className={inputCls}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes)</label>
              <select className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)}>
                {["30", "45", "60", "90", "120"].map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Optional notes about this visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
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

  const appointments: Appointment[] = data?.results ?? data ?? [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">All property visits and meetings</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Book Appointment
        </button>
      </div>

      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Lead</th>
                <th className="px-6 py-3">Property</th>
                <th className="px-6 py-3">Agent</th>
                <th className="px-6 py-3">Scheduled At</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    {a.lead_name && <p className="text-sm font-medium text-gray-800">{a.lead_name}</p>}
                    <p className="font-mono text-xs text-gray-500">{a.lead_phone}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {a.property_title || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {a.agent_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{formatDate(a.scheduled_at)}</td>
                  <td className="px-6 py-3 text-gray-500">{a.duration_minutes} min</td>
                  <td className="px-6 py-3">
                    <Badge label={a.status} variant={STATUS_COLOR[a.status]} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      {a.status === "scheduled" && (
                        <button onClick={() => confirmMutation.mutate(a.id)} className="text-xs text-blue-600 hover:underline">
                          Confirm
                        </button>
                      )}
                      {a.status === "confirmed" && (
                        <button onClick={() => completeMutation.mutate(a.id)} className="text-xs text-green-600 hover:underline">
                          Complete
                        </button>
                      )}
                      {["scheduled", "confirmed"].includes(a.status) && (
                        <button onClick={() => cancelMutation.mutate(a.id)} className="text-xs text-red-500 hover:underline">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
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
