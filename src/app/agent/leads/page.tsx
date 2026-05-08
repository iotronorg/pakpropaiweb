"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";

interface Lead {
  id: string;
  phone: string;
  name: string | null;
  budget_min: number | null;
  budget_max: number | null;
  location_interest: string | null;
  intent_score: number | null;
  status: string;
  assigned_agent_name: string | null;
  created_at: string;
}

function IntentBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "bg-green-500" : score >= 4 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}/10</span>
    </div>
  );
}

export default function AgentLeadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-leads-full"],
    queryFn: () => api.get("/leads/").then((r) => r.data).catch(() => ({ results: [] })),
  });

  const leads: Lead[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
        <p className="mt-1 text-sm text-gray-500">All leads assigned to you, sorted by intent score</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Location Interest</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Intent Score</th>
                <th className="px-6 py-3">Assigned To</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads
                .sort((a, b) => (b.intent_score ?? 0) - (a.intent_score ?? 0))
                .map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{l.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400 font-mono">{l.phone}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{l.location_interest || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {l.budget_max ? formatPKR(l.budget_max) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {l.intent_score !== null ? (
                        <IntentBar score={l.intent_score} />
                      ) : (
                        <span className="text-gray-300 text-xs">Unscored</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {l.assigned_agent_name || <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        label={l.status}
                        variant={
                          l.status === "qualified" ? "green"
                            : l.status === "cold" ? "gray"
                            : "yellow"
                        }
                      />
                    </td>
                    <td className="px-6 py-3 text-gray-400">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No leads yet — they appear here when buyers connect via WhatsApp
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
