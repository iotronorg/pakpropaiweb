"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";

interface Verification {
  id: string;
  status: string;
  signal_score: number | null;
  property_id: string;
  property_title: string;
  property_city: string;
  requester_phone: string | null;
  reviewer_phone: string | null;
  document_count: number;
  total_red_flags: number;
  document_types: string[];
  fraud_flags: string[];
  notes: string;
  verified_at: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray" | "blue"> = {
  passed:   "green",
  pending:  "yellow",
  failed:   "red",
  disputed: "blue",
};

function SignalBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-300">—</span>;
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}/100</span>
    </div>
  );
}

export default function VerificationPage() {
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () => api.get("/verification/queue/").then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      api.patch(`/verification/queue/${id}/`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setReviewingId(null);
      setNotes("");
    },
  });

  const verifications: Verification[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review property verification requests — approve or reject based on document signals
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : verifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">No verification requests yet.</p>
          <p className="mt-2 text-xs text-gray-300">
            Requests appear here when users submit documents via WhatsApp.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Property</th>
                <th className="px-6 py-3">Requester</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Signal Score</th>
                <th className="px-6 py-3">Docs</th>
                <th className="px-6 py-3">Red Flags</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {verifications.map((v) => (
                <>
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{v.property_title}</p>
                      <p className="text-xs text-gray-400">{v.property_city}</p>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {v.requester_phone || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={v.status} variant={STATUS_COLOR[v.status] ?? "gray"} />
                    </td>
                    <td className="px-6 py-3">
                      <SignalBar score={v.signal_score} />
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {v.document_count}
                      {v.document_types.length > 0 && (
                        <p className="text-xs text-gray-400">{v.document_types.join(", ")}</p>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {v.total_red_flags > 0 ? (
                        <span className="text-red-600 font-semibold">{v.total_red_flags}</span>
                      ) : (
                        <span className="text-green-600 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(v.created_at)}</td>
                    <td className="px-6 py-3">
                      {v.status === "pending" && (
                        <button
                          onClick={() => setReviewingId(reviewingId === v.id ? null : v.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Review
                        </button>
                      )}
                      {v.status !== "pending" && (
                        <span className="text-xs text-gray-300">
                          by {v.reviewer_phone || "admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {reviewingId === v.id && (
                    <tr key={`${v.id}-review`} className="bg-blue-50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Notes (optional)
                            </label>
                            <input
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add review notes…"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <button
                            onClick={() => reviewMutation.mutate({ id: v.id, status: "passed", notes })}
                            disabled={reviewMutation.isPending}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reviewMutation.mutate({ id: v.id, status: "failed", notes })}
                            disabled={reviewMutation.isPending}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => reviewMutation.mutate({ id: v.id, status: "disputed", notes })}
                            disabled={reviewMutation.isPending}
                            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                          >
                            Dispute
                          </button>
                          <button
                            onClick={() => { setReviewingId(null); setNotes(""); }}
                            className="text-sm text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
