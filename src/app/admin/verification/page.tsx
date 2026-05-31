"use client";
import { X } from "lucide-react";

import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVerificationQueue, reviewVerification, getDocumentScans,
  bulkRejectVerifications, linkDocumentToVerification,
} from "@/lib/api";
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
  if (score === null) return <span className="text-xs text-[var(--text-faint)]">—</span>;
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-[var(--text-muted)]">{score}/100</span>
    </div>
  );
}

// ── Document Scan Detail Modal ────────────────────────────────────────────────

function ScanDetailModal({
  verificationId,
  propertyId,
  onClose,
}: {
  verificationId: string;
  propertyId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [linkingId, setLinkingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["doc-scans", verificationId, propertyId],
    queryFn: () =>
      getDocumentScans({ property: propertyId }).then((r) => r.data),
  });

  const linkMutation = useMutation({
    mutationFn: ({ scanId, verifId }: { scanId: number; verifId: string }) =>
      linkDocumentToVerification(scanId, verifId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-scans"] });
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      setLinkingId(null);
    },
  });

  const scans: (DocumentScan & { verification?: string | null })[] =
    data?.results ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="scan-modal-title" className="bg-[var(--bg-surface)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 id="scan-modal-title" className="font-semibold text-[var(--text-primary)]">Document Scans</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={16} aria-hidden="true" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {isLoading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
          {!isLoading && scans.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-8">No document scans for this property.</p>
          )}
          {scans.map((scan) => {
            const isLinkedHere = scan.verification === verificationId;
            const isUnlinked = !scan.verification;

            const extractedFields: [string, string][] = [
              ["Owner", scan.owner_name],
              ["ID Number", scan.cnic_number],
              ["Address", scan.property_address],
              ["Area", scan.area],
              ["Authority", scan.authority],
            ].filter(([, v]) => v) as [string, string][];

            return (
              <div
                key={scan.id}
                className={`border rounded-xl p-4 space-y-3 ${
                  isLinkedHere ? "border-blue-200 bg-blue-50/30"
                  : isUnlinked ? "border-dashed border-[var(--border-strong)]"
                  : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                    {scan.document_type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    {isLinkedHere && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Linked
                      </span>
                    )}
                    {isUnlinked && (
                      <span className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">
                        Unlinked
                      </span>
                    )}
                    {scan.confidence !== null && (
                      <span className="text-xs text-[var(--text-muted)]">
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

                <p className="text-xs text-[var(--text-muted)] font-mono">{scan.submitter_phone} · {formatDate(scan.created_at)}</p>

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
                    <p className="text-xs font-semibold text-[var(--text-muted)] mb-1.5">Extracted Fields</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {extractedFields.map(([k, v]) => (
                        <div key={k} className="flex gap-1">
                          <span className="text-xs text-[var(--text-muted)]">{k}:</span>
                          <span className="text-xs text-[var(--text-muted)] font-medium truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scan.whatsapp_summary && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">AI Summary</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{scan.whatsapp_summary}</p>
                  </div>
                )}

                {isUnlinked && (
                  linkingId === scan.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-[var(--text-muted)]">Link to this verification?</span>
                      <button
                        type="button"
                        onClick={() => linkMutation.mutate({ scanId: scan.id, verifId: verificationId })}
                        disabled={linkMutation.isPending}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {linkMutation.isPending ? "Linking…" : "Confirm Link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkingId(null)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLinkingId(scan.id)}
                      className="text-xs text-blue-600 hover:underline font-medium pt-1"
                    >
                      + Link to this Verification
                    </button>
                  )
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
  const [scanModalVerif, setScanModalVerif] = useState<Verification | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedVerifIds, setSelectedVerifIds] = useState<Set<string>>(new Set());
  const [bulkNotes, setBulkNotes] = useState("");

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

  const bulkRejectMutation = useMutation({
    mutationFn: ({ ids, notes }: { ids: string[]; notes?: string }) =>
      bulkRejectVerifications(ids, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerifIds(new Set());
      setBulkNotes("");
    },
  });

  const verifications: Verification[] = data?.results ?? [];

  function handleToggleVerif(id: string) {
    setSelectedVerifIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSelectAllVerifs() {
    const pending = verifications.filter((v) => v.status === "pending");
    if (selectedVerifIds.size === pending.length && pending.length > 0) {
      setSelectedVerifIds(new Set());
    } else {
      setSelectedVerifIds(new Set(pending.map((v) => v.id)));
    }
  }

  const pendingVerifs = verifications.filter((v) => v.status === "pending");

  return (
    <div>
      {scanModalVerif && (
        <ScanDetailModal
          verificationId={scanModalVerif.id}
          propertyId={scanModalVerif.property_id}
          onClose={() => setScanModalVerif(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Verification Queue</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Review property verification requests — approve or reject based on document signals
        </p>
      </div>

      {/* Bulk reject toolbar */}
      {selectedVerifIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-800">
            {selectedVerifIds.size} verification{selectedVerifIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex-1 flex items-center gap-2">
            <label className="sr-only" htmlFor="bulk-reject-notes">Rejection notes</label>
            <input
              id="bulk-reject-notes"
              type="text"
              placeholder="Rejection notes (optional)"
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              className="flex-1 max-w-xs rounded-lg border border-red-200 bg-[var(--bg-surface)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`Reject ${selectedVerifIds.size} verification${selectedVerifIds.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
                bulkRejectMutation.mutate({ ids: Array.from(selectedVerifIds), notes: bulkNotes || undefined });
              }}
              disabled={bulkRejectMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {bulkRejectMutation.isPending ? "Rejecting…" : `Bulk Reject (${selectedVerifIds.size})`}
            </button>
          </div>
          <button type="button" onClick={() => setSelectedVerifIds(new Set())} className="text-xs text-red-500 hover:underline">
            Clear
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : verifications.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-16 text-center">
          <p className="text-[var(--text-muted)] text-sm">No verification requests yet.</p>
          <p className="mt-2 text-xs text-[var(--text-faint)]">
            Requests appear here when users submit documents via WhatsApp.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedVerifIds.size === pendingVerifs.length && pendingVerifs.length > 0}
                    onChange={handleSelectAllVerifs}
                    aria-label="Select all pending verifications"
                    className="rounded border-[var(--border-strong)]"
                  />
                </th>
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
            <tbody className="divide-y divide-[var(--border)]">
              {verifications.map((v) => (
                <Fragment key={v.id}>
                  <tr className="hover:bg-[var(--bg-muted)]">
                    <td className="px-4 py-3">
                      {v.status === "pending" && (
                        <input
                          type="checkbox"
                          checked={selectedVerifIds.has(v.id)}
                          onChange={() => handleToggleVerif(v.id)}
                          aria-label={`Select ${v.property_title}`}
                          className="rounded border-[var(--border-strong)]"
                        />
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{v.property_title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{v.property_city}</p>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-[var(--text-muted)]">
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
                        type="button"
                        onClick={() => setScanModalVerif(v)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        {v.document_count} {v.document_count === 1 ? "doc" : "docs"}
                      </button>
                      {v.document_types.length > 0 && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{v.document_types.join(", ")}</p>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {v.total_red_flags > 0 ? (
                        <span className="text-red-600 font-semibold">{v.total_red_flags}</span>
                      ) : (
                        <span className="text-green-600 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)] text-xs">{formatDate(v.created_at)}</td>
                    <td className="px-6 py-3">
                      {v.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => setReviewingId(reviewingId === v.id ? null : v.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Review
                        </button>
                      )}
                      {v.status !== "pending" && (
                        <span className="text-xs text-[var(--text-faint)]">
                          by {v.reviewer_phone || "admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {reviewingId === v.id && (
                    <tr className="bg-[var(--bg-subtle)]">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <label htmlFor={`review-notes-${v.id}`} className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                              Notes (optional)
                            </label>
                            <input
                              id={`review-notes-${v.id}`}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add review notes…"
                              className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => reviewMutation.mutate({ id: v.id, status: "passed", notes })}
                            disabled={reviewMutation.isPending}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm("Reject this verification? The property will be marked as failed.")) return;
                              reviewMutation.mutate({ id: v.id, status: "failed", notes });
                            }}
                            disabled={reviewMutation.isPending}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewMutation.mutate({ id: v.id, status: "disputed", notes })}
                            disabled={reviewMutation.isPending}
                            className="rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                          >
                            Dispute
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReviewingId(null); setNotes(""); }}
                            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
