"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVerificationQueue, reviewVerification, getDocumentScans } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { DocumentScan } from "@/types";

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

// ── Document Scan Detail Modal ────────────────────────────────────────────────

function ScanDetailModal({ verificationId, onClose }: { verificationId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["doc-scans", verificationId],
    queryFn: () => getDocumentScans({ verification: verificationId }).then((r) => r.data),
  });

  const scans: DocumentScan[] = data?.results ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Document Scans</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {isLoading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
          {!isLoading && scans.length === 0 && (
            <p className="text-center text-gray-400 py-8">No document scans linked to this verification.</p>
          )}
          {scans.map((scan) => {
            const extractedFields: [string, string][] = [
              ["Owner", scan.owner_name],
              ["CNIC", scan.cnic_number],
              ["Address", scan.property_address],
              ["Area", scan.area],
              ["Authority", scan.authority],
            ].filter(([, v]) => v) as [string, string][];

            return (
              <div key={scan.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 capitalize">
                    {scan.document_type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    {scan.confidence !== null && (
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round((scan.confidence ?? 0) * 100)}%
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      scan.status === "completed" ? "bg-green-50 text-green-700"
                      : scan.status === "failed" ? "bg-red-50 text-red-700"
                      : "bg-yellow-50 text-yellow-700"
                    }`}>{scan.status}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 font-mono">{scan.submitter_phone} · {formatDate(scan.created_at)}</p>

                {scan.red_flags.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Red Flags ({scan.red_flag_count})</p>
                    <ul className="space-y-0.5">
                      {scan.red_flags.map((f, i) => (
                        <li key={i} className="text-xs text-red-600 flex gap-1">
                          <span>•</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {extractedFields.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Extracted Fields</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {extractedFields.map(([k, v]) => (
                        <div key={k} className="flex gap-1">
                          <span className="text-xs text-gray-400">{k}:</span>
                          <span className="text-xs text-gray-700 font-medium truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scan.whatsapp_summary && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">AI Summary</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{scan.whatsapp_summary}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VerificationPage() {
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [scanModalId, setScanModalId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () => getVerificationQueue().then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      reviewVerification(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setReviewingId(null);
      setNotes("");
    },
  });

  const verifications: Verification[] = data?.results ?? [];

  return (
    <div>
      {scanModalId && (
        <ScanDetailModal verificationId={scanModalId} onClose={() => setScanModalId(null)} />
      )}

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
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setScanModalId(v.id)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        {v.document_count} {v.document_count === 1 ? "doc" : "docs"}
                      </button>
                      {v.document_types.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{v.document_types.join(", ")}</p>
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
