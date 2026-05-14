"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeam, removeTeamMember, getAgentsList, addTeamMember, getPendingAgents, approveAgent, rejectAgent } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import type { AgentProfile } from "@/types";

const SPEC_LABEL: Record<string, string> = {
  residential_buy:  "Buy/Sell",
  residential_rent: "Rent/Lease",
  commercial:       "Commercial",
  plots:            "Plots",
  new_projects:     "Off-plan",
  luxury:           "Luxury",
  industrial:       "Industrial",
};

export default function DeveloperTeamPage() {
  const queryClient = useQueryClient();
  const [tab,          setTab]          = useState<"team" | "pending">("team");
  const [addAgentId,   setAddAgentId]   = useState("");
  const [showSearch,   setShowSearch]   = useState(false);
  const [rejectId,     setRejectId]     = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── Approved team ────────────────────────────────────────────────────────────
  const { data: teamData, isLoading } = useQuery({
    queryKey: ["dev-team"],
    queryFn: () => getTeam().then((r) => r.data),
  });

  // ── All agents for "add agent" dropdown ─────────────────────────────────────
  const { data: agentsData } = useQuery({
    queryKey: ["agents-list"],
    queryFn: () => getAgentsList().then((r) => r.data),
    enabled: showSearch,
  });

  // ── Pending applications for this org ────────────────────────────────────────
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["dev-pending-agents"],
    queryFn: () => getPendingAgents().then((r) => r.data),
  });

  const members: AgentProfile[]      = teamData?.results ?? teamData ?? [];
  const allAgents: AgentProfile[]    = agentsData?.results ?? [];
  const pendingAgents: AgentProfile[] = (pendingData?.results ?? pendingData ?? []) as AgentProfile[];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["dev-team"] });
    queryClient.invalidateQueries({ queryKey: ["dev-pending-agents"] });
  };

  const addMutation = useMutation({
    mutationFn: (id: number) => addTeamMember(id),
    onSuccess: () => {
      invalidateAll();
      setAddAgentId("");
      setShowSearch(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeTeamMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dev-team"] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveAgent(id),
    onSuccess: () => invalidateAll(),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectAgent(id, reason),
    onSuccess: () => { invalidateAll(); setRejectId(null); setRejectReason(""); },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
          <p className="mt-1 text-sm text-gray-500">Agents under your organization</p>
        </div>
        {tab === "team" && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Add Existing Agent
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {(["team", "pending"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "team" ? "Active Team" : (
              <span className="flex items-center gap-2">
                Pending Approval
                {pendingAgents.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                    {pendingAgents.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Active Team Tab ──────────────────────────────────────────────────── */}
      {tab === "team" && (
        <>
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
                  <p className="text-sm mt-1">Approve pending applications or add existing agents above.</p>
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
                          {a.specializations?.slice(0, 2).map((s) => SPEC_LABEL[s] ?? s).join(", ") || "—"}
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
        </>
      )}

      {/* ── Pending Approval Tab ─────────────────────────────────────────────── */}
      {tab === "pending" && (
        <div>
          {pendingLoading ? (
            <LoadingSpinner />
          ) : pendingAgents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-400">
              <p className="font-medium">No pending applications</p>
              <p className="text-sm mt-1">
                Agents who register and select your organization will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">City</th>
                    <th className="px-5 py-3">Specializations</th>
                    <th className="px-5 py-3">Applied</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingAgents.map((a) => (
                    <tr key={a.id} className="hover:bg-amber-50/40">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{a.name}</p>
                        {a.email && <p className="text-xs text-gray-400">{a.email}</p>}
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-700">{a.phone}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs capitalize">
                        {a.agent_type.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{a.primary_city || "—"}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {a.specializations?.slice(0, 2).map((s) => SPEC_LABEL[s] ?? s).join(", ") || "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(a.joined_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => approveMutation.mutate(a.id)}
                            disabled={approveMutation.isPending}
                            className="text-xs px-2.5 py-1 rounded-md border border-green-200 text-green-700 hover:bg-green-50 font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectId(a.id); setRejectReason(""); }}
                            className="text-xs px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reject modal */}
          {rejectId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Application</h3>
                <p className="text-sm text-gray-500 mb-4">
                  The agent will be notified with this reason via WhatsApp.
                </p>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. We don't have openings in your city right now. Please reapply in 3 months."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setRejectId(null)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {rejectMutation.isPending ? "Rejecting…" : "Confirm Reject"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
