"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, autoAssignLead, assignAgentToLead, suggestAgentsForLead } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatPKR } from "@/lib/utils";
import type { Lead } from "@/types";

interface AgentSuggestion {
  id: number;
  name: string;
  phone: string;
  rating: number | null;
  availability_status: string;
}

export default function DeveloperLeadsPage() {
  const qc = useQueryClient();
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["dev-leads"],
    queryFn: () => getLeads().then((r) => r.data).catch(() => ({ results: [], count: 0 })),
  });

  const autoAssignMutation = useMutation({
    mutationFn: (id: string) => autoAssignLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-leads"] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ leadId, agentId }: { leadId: string; agentId: number }) =>
      assignAgentToLead(leadId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-leads"] });
      setAssignLeadId(null);
      setSuggestions([]);
    },
  });

  const leads: Lead[] = data?.results ?? [];
  const hot = leads.filter((l) => (l.intent_score ?? 0) >= 7);
  const warm = leads.filter((l) => (l.intent_score ?? 0) >= 4 && (l.intent_score ?? 0) < 7);
  const cold = leads.filter((l) => (l.intent_score ?? 0) < 4);

  async function openAssign(leadId: string) {
    if (assignLeadId === leadId) {
      setAssignLeadId(null);
      setSuggestions([]);
      return;
    }
    setAssignLeadId(leadId);
    setSuggestions([]);
    try {
      const res = await suggestAgentsForLead(leadId);
      setSuggestions(res.data ?? []);
    } catch {
      setSuggestions([]);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lead Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Buyer interest, intent breakdown, and assignment</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
              <p className="text-3xl font-bold text-green-700">{hot.length}</p>
              <p className="text-sm text-green-600 mt-1">Hot Leads</p>
              <p className="text-xs text-green-500">Intent ≥ 7/10</p>
            </div>
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center">
              <p className="text-3xl font-bold text-yellow-700">{warm.length}</p>
              <p className="text-sm text-yellow-600 mt-1">Warm Leads</p>
              <p className="text-xs text-yellow-500">Intent 4–6/10</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
              <p className="text-3xl font-bold text-gray-600">{cold.length}</p>
              <p className="text-sm text-gray-500 mt-1">Cold Leads</p>
              <p className="text-xs text-gray-400">Intent &lt; 4/10</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">All Leads</h2>
              <span className="text-xs text-gray-400">{data?.count ?? 0} total</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Intent</th>
                  <th className="px-6 py-3">Assigned To</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((l) => (
                  <>
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{l.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400 font-mono">{l.phone}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{l.location_interest || "—"}</td>
                      <td className="px-6 py-3 text-gray-600">{l.budget_max ? formatPKR(l.budget_max) : "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`font-bold text-sm ${
                          (l.intent_score ?? 0) >= 7 ? "text-green-600"
                            : (l.intent_score ?? 0) >= 4 ? "text-yellow-600"
                            : "text-gray-400"
                        }`}>
                          {l.intent_score !== null ? `${l.intent_score}/10` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {l.assigned_agent_name || <span className="text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          label={l.status}
                          variant={l.status === "qualified" ? "green" : l.status === "cold" ? "gray" : "yellow"}
                        />
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(l.created_at)}</td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          {!l.assigned_agent_name && (
                            <button
                              onClick={() => autoAssignMutation.mutate(l.id)}
                              disabled={autoAssignMutation.isPending}
                              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                            >
                              Auto-assign
                            </button>
                          )}
                          <button
                            onClick={() => openAssign(l.id)}
                            className={`text-xs hover:underline ${assignLeadId === l.id ? "text-gray-400" : "text-purple-600"}`}
                          >
                            {assignLeadId === l.id ? "Close" : "Assign"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {assignLeadId === l.id && (
                      <tr key={`${l.id}-assign`} className="bg-purple-50">
                        <td colSpan={8} className="px-6 py-3">
                          {suggestions.length === 0 ? (
                            <p className="text-xs text-gray-400">Loading suggested agents…</p>
                          ) : (
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-xs font-medium text-gray-600">Suggested agents:</span>
                              {suggestions.map((agent) => (
                                <button
                                  key={agent.id}
                                  onClick={() => assignMutation.mutate({ leadId: l.id, agentId: agent.id })}
                                  disabled={assignMutation.isPending}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs hover:bg-purple-100 transition-colors disabled:opacity-50"
                                >
                                  <span className="font-medium text-gray-800">{agent.name}</span>
                                  <span className="text-gray-400">{agent.phone}</span>
                                  {agent.rating !== null && (
                                    <span className="text-yellow-500">★ {agent.rating}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      No leads yet — they appear when buyers engage via WhatsApp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
