"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentsList, updateAgent } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { AgentProfile } from "@/types";

export default function AgentsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => getAgentsList().then((r) => r.data),
  });

  const agents: AgentProfile[] = data?.results ?? data ?? [];

  const toggle = useMutation({
    mutationFn: ({ id, field, value }: { id: number; field: string; value: boolean }) =>
      updateAgent(id, { [field]: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-agents"] }),
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="mt-1 text-sm text-gray-500">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">No agents yet.</p>
          <p className="mt-1 text-xs text-gray-300">Add agents via Django admin → Agents → Add Agent.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Cities</th>
                <th className="px-5 py-3">Specializations</th>
                <th className="px-5 py-3">Performance</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Verified</th>
                <th className="px-5 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.phone}</p>
                    {a.company_name && (
                      <p className="text-xs text-gray-400">{a.company_name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={a.agent_type} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {a.cities.length > 0
                        ? a.cities.map((c) => <Badge key={c} label={c} variant="blue" />)
                        : <span className="text-gray-300 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {a.specializations.length > 0
                        ? a.specializations.map((s) => <Badge key={s} label={s} />)
                        : <span className="text-gray-300 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-500">{a.total_leads} leads</p>
                      <p className="text-xs text-gray-500">{a.total_listings} listings</p>
                      <p className="text-xs text-gray-500">{a.closed_deals} closed</p>
                      {a.rating !== null && (
                        <p className="text-xs text-gray-500">⭐ {a.rating}/5</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(a.joined_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggle.mutate({ id: a.id, field: "is_verified", value: !a.is_verified })}
                      disabled={toggle.isPending}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                        a.is_verified
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {a.is_verified ? "Verified" : "Unverified"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggle.mutate({ id: a.id, field: "is_active", value: !a.is_active })}
                      disabled={toggle.isPending}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                        a.is_active
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      }`}
                    >
                      {a.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
