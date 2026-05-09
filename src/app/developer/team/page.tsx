"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeam, removeTeamMember, getAgentsList, addTeamMember } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { AgentProfile } from "@/types";

export default function DeveloperTeamPage() {
  const queryClient = useQueryClient();
  const [addAgentId, setAddAgentId] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["dev-team"],
    queryFn: () => getTeam().then((r) => r.data),
  });

  const { data: agentsData } = useQuery({
    queryKey: ["agents-list"],
    queryFn: () => getAgentsList().then((r) => r.data),
    enabled: showSearch,
  });

  const addMutation = useMutation({
    mutationFn: (id: number) => addTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-team"] });
      setAddAgentId("");
      setShowSearch(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeTeamMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dev-team"] }),
  });

  const members: AgentProfile[] = teamData?.results ?? teamData ?? [];
  const allAgents: AgentProfile[] = agentsData?.results ?? [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
          <p className="mt-1 text-sm text-gray-500">Agents under your organization</p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Add Agent
        </button>
      </div>

      {/* Add agent panel */}
      {showSearch && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">Add Agent to Team</h3>
          <div className="flex gap-3">
            <select
              value={addAgentId}
              onChange={(e) => setAddAgentId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an agent...</option>
              {allAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.phone} ({a.primary_city})
                </option>
              ))}
            </select>
            <button
              onClick={() => addAgentId && addMutation.mutate(Number(addAgentId))}
              disabled={!addAgentId || addMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          {addMutation.isError && (
            <p className="mt-2 text-xs text-red-500">Failed to add agent. They may already be on your team.</p>
          )}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {members.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-400">
              <p className="font-medium">No agents in your team yet</p>
              <p className="text-sm mt-1">Add agents to start managing your sales team</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Specializations</th>
                  <th className="px-6 py-3">Leads</th>
                  <th className="px-6 py-3">Deals</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{a.phone}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600 capitalize">{a.agent_type.replace(/_/g, " ")}</td>
                    <td className="px-6 py-3 text-gray-600">{a.primary_city || "—"}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {a.specializations?.slice(0, 2).join(", ") || "—"}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">{a.total_leads}</td>
                    <td className="px-6 py-3 text-blue-600">{a.closed_deals}</td>
                    <td className="px-6 py-3 text-gray-600">{a.rating?.toFixed(1) ?? "—"}</td>
                    <td className="px-6 py-3">
                      <Badge
                        label={a.is_verified ? "Verified" : "Pending"}
                        variant={a.is_verified ? "green" : "yellow"}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => removeMutation.mutate(a.id)}
                        disabled={removeMutation.isPending}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
