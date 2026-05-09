"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppointments, confirmAppointment, completeAppointment } from "@/lib/api";
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

export default function AgentAppointmentsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["agent-appointments"],
    queryFn: () => getAppointments().then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-appointments"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-appointments"] }),
  });

  const appointments: Appointment[] = data?.results ?? data ?? [];

  const upcoming = appointments.filter((a) =>
    ["scheduled", "confirmed"].includes(a.status)
  );
  const past = appointments.filter((a) =>
    ["completed", "cancelled", "rescheduled"].includes(a.status)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="mt-1 text-sm text-gray-500">Your scheduled property visits and meetings</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Upcoming ({upcoming.length})
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {upcoming.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No upcoming appointments</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-3">Lead</th>
                      <th className="px-6 py-3">Property</th>
                      <th className="px-6 py-3">Scheduled At</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {upcoming.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{a.lead_phone}</td>
                        <td className="px-6 py-3 text-gray-600">{a.property_title || "—"}</td>
                        <td className="px-6 py-3 text-gray-700">{formatDate(a.scheduled_at)}</td>
                        <td className="px-6 py-3 text-gray-500">{a.duration_minutes} min</td>
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
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Past ({past.length})
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {past.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No past appointments</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-3">Lead</th>
                      <th className="px-6 py-3">Property</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {past.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{a.lead_phone}</td>
                        <td className="px-6 py-3 text-gray-600">{a.property_title || "—"}</td>
                        <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(a.scheduled_at)}</td>
                        <td className="px-6 py-3">
                          <Badge label={a.status} variant={STATUS_COLOR[a.status]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
