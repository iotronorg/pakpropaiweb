"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDuplicateLeads, mergeLeads } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";

interface DuplicateLead {
  id: string;
  phone: string;
  status: string;
  intent: string;
  created_at: string;
}

interface DuplicateGroup {
  normalized_phone: string;
  leads: DuplicateLead[];
}

interface MergeModal {
  group: DuplicateGroup;
  primaryId: string;
  secondaryId: string;
}

const STATUS_COLOR: Record<string, string> = {
  new:           "bg-blue-50 text-blue-700",
  contacted:     "bg-yellow-50 text-yellow-700",
  interested:    "bg-green-50 text-green-700",
  cold:          "bg-gray-100 text-gray-500",
  spam:          "bg-red-50 text-red-600",
  closed_won:    "bg-emerald-50 text-emerald-700",
  closed_lost:   "bg-gray-100 text-gray-500",
  unresponsive:  "bg-orange-50 text-orange-600",
};

export default function AdminDuplicateLeadsPage() {
  const qc = useQueryClient();
  const [mergeModal, setMergeModal] = useState<MergeModal | null>(null);
  const [mergeError, setMergeError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-duplicate-leads"],
    queryFn: () => getDuplicateLeads().then((r) => r.data),
  });

  const mergeMutation = useMutation({
    mutationFn: ({ primary_id, secondary_id }: { primary_id: string; secondary_id: string }) =>
      mergeLeads(primary_id, secondary_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-duplicate-leads"] });
      setMergeModal(null);
      setMergeError("");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setMergeError(err.response?.data?.detail ?? "Merge failed.");
    },
  });

  const groups: DuplicateGroup[] = data?.results ?? [];

  function openMergeModal(group: DuplicateGroup) {
    // default: keep the older lead (index 0) as primary
    setMergeModal({
      group,
      primaryId: group.leads[0].id,
      secondaryId: group.leads[1].id,
    });
    setMergeError("");
  }

  function swapMergeRoles() {
    if (!mergeModal) return;
    setMergeModal((m) => m ? {
      ...m,
      primaryId: m.secondaryId,
      secondaryId: m.primaryId,
    } : null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Duplicate Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lead pairs that share the same normalized phone number — likely the same person.
          Merge to keep one canonical record.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm text-gray-400">No duplicate leads detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">{data?.count ?? groups.length} duplicate group(s) found</p>
          {groups.map((group, i) => (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-amber-100 bg-amber-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Duplicate Group</span>
                  <span className="font-mono text-sm text-amber-800">{group.normalized_phone}</span>
                </div>
                {group.leads.length === 2 && (
                  <button
                    onClick={() => openMergeModal(group)}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    Merge →
                  </button>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-amber-100">
                    <th className="px-5 py-2">Lead ID</th>
                    <th className="px-5 py-2">Phone (raw)</th>
                    <th className="px-5 py-2">Status</th>
                    <th className="px-5 py-2">Intent</th>
                    <th className="px-5 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {group.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-amber-50/50">
                      <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{lead.id.slice(0, 8)}…</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-gray-700">{lead.phone}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {lead.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-600 capitalize">{lead.intent || "—"}</td>
                      <td className="px-5 py-2.5 text-gray-400 text-xs">{formatDate(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Merge confirmation modal */}
      {mergeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Merge Duplicate Leads</h2>
              <button onClick={() => setMergeModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <p className="text-sm text-gray-600">
              All messages, appointments, and notes from the <span className="font-semibold text-red-600">secondary</span> lead
              will be transferred to the <span className="font-semibold text-blue-600">primary</span>.
              The secondary lead will be permanently deleted.
            </p>

            <div className="space-y-2">
              {mergeModal.group.leads.map((lead) => {
                const isPrimary = lead.id === mergeModal.primaryId;
                return (
                  <div key={lead.id} className={`rounded-lg border p-3 ${isPrimary ? "border-blue-300 bg-blue-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-bold uppercase ${isPrimary ? "text-blue-700" : "text-red-600"}`}>
                          {isPrimary ? "Keep (Primary)" : "Delete (Secondary)"}
                        </span>
                        <p className="font-mono text-sm text-gray-700 mt-0.5">{lead.phone}</p>
                        <p className="text-xs text-gray-500">{lead.status} · created {formatDate(lead.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={swapMergeRoles}
              className="w-full text-center text-xs text-gray-500 hover:text-blue-600 hover:underline"
            >
              ⇅ Swap primary / secondary
            </button>

            {mergeError && (
              <p className="text-xs text-red-600 text-center">{mergeError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => mergeMutation.mutate({
                  primary_id: mergeModal.primaryId,
                  secondary_id: mergeModal.secondaryId,
                })}
                disabled={mergeMutation.isPending}
                className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {mergeMutation.isPending ? "Merging…" : "Confirm Merge"}
              </button>
              <button
                onClick={() => setMergeModal(null)}
                className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
