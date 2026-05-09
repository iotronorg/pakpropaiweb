"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments, confirmAppointment, cancelAppointment, completeAppointment,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_COLOR: Record<AppointmentStatus, "green" | "yellow" | "red" | "gray" | "blue"> = {
  scheduled:   "yellow",
  confirmed:   "blue",
  completed:   "green",
  cancelled:   "red",
  rescheduled: "gray",
};

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="mt-1 text-sm text-gray-500">All property visits and meetings</p>
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
                    <p className="font-mono text-xs text-gray-500">{a.lead_phone}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {a.property_title || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {a.agent_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {formatDate(a.scheduled_at)}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {a.duration_minutes} min
                  </td>
                  <td className="px-6 py-3">
                    <Badge label={a.status} variant={STATUS_COLOR[a.status]} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      {a.status === "scheduled" && (
                        <button
                          onClick={() => confirmMutation.mutate(a.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Confirm
                        </button>
                      )}
                      {a.status === "confirmed" && (
                        <button
                          onClick={() => completeMutation.mutate(a.id)}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Complete
                        </button>
                      )}
                      {["scheduled", "confirmed"].includes(a.status) && (
                        <button
                          onClick={() => cancelMutation.mutate(a.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
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
    </div>
  );
}
