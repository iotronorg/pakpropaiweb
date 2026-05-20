"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAgentsList, approveAgent, rejectAgent, createAgent,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type RegStatus = "approved" | "pending" | "rejected";

const STATUS_TABS: { key: RegStatus | "all"; label: string }[] = [
  { key: "all",      label: "All Agents" },
  { key: "approved", label: "Active"     },
  { key: "pending",  label: "Pending"    },
  { key: "rejected", label: "Rejected"   },
];

export default function OrgTeamPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | RegStatus>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", employment_type: "internal" });
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["org-team", tab],
    queryFn: () =>
      getAgentsList(tab !== "all" ? { status: tab } : {}).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveAgent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-team"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectAgent(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-team"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => createAgent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-team"] });
      setShowAdd(false);
      setForm({ name: "", phone: "", employment_type: "internal" });
    },
  });

  const agents = data?.results ?? data ?? [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's agents and pending applications
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Add Agent
        </button>
      </div>

      {/* Add agent form */}
      {showAdd && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-blue-800">Add New Agent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              placeholder="Phone (E.164, e.g. +12025550123)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={form.employment_type}
              onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="internal">Internal</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || !form.phone || createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "Adding…" : "Add Agent"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-600">Failed to add agent. Check the phone number format.</p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : agents.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No agents in this category</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Agent", "Phone", "Type", "Status", "Verified", "Leads", "Deals", "Rating", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((a: {
                  id: number; name: string; phone: string; employment_type: string;
                  registration_status: string; is_verified: boolean; is_active: boolean;
                  total_leads: number; closed_deals: number; rating: number | null;
                }) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-violet-600">
                            {a.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 tabular-nums">{a.phone}</td>
                    <td className="px-5 py-3 capitalize text-gray-600">{a.employment_type}</td>
                    <td className="px-5 py-3">
                      <Badge
                        label={a.registration_status}
                        variant={
                          a.registration_status === "approved" ? "green"
                          : a.registration_status === "pending"  ? "yellow"
                          : "gray"
                        }
                      />
                    </td>
                    <td className="px-5 py-3">
                      <Badge label={a.is_verified ? "Yes" : "No"} variant={a.is_verified ? "green" : "gray"} />
                    </td>
                    <td className="px-5 py-3 tabular-nums text-gray-600">{a.total_leads}</td>
                    <td className="px-5 py-3 tabular-nums text-gray-600">{a.closed_deals}</td>
                    <td className="px-5 py-3">
                      {a.rating !== null ? `⭐ ${a.rating.toFixed(1)}` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {a.registration_status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveMutation.mutate(a.id)}
                            disabled={approveMutation.isPending}
                            className="text-xs px-2.5 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Approve
                          </button>
                          <div className="flex items-center gap-1">
                            <input
                              placeholder="Reason"
                              value={rejectReason[a.id] ?? ""}
                              onChange={(e) => setRejectReason((r) => ({ ...r, [a.id]: e.target.value }))}
                              className="text-xs border border-gray-200 rounded px-1.5 py-1 w-24 focus:outline-none"
                            />
                            <button
                              onClick={() => rejectMutation.mutate({ id: a.id, reason: rejectReason[a.id] ?? "" })}
                              disabled={rejectMutation.isPending}
                              className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
