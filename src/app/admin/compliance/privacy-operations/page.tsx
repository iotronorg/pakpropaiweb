"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPrivacyAuditLog,
  getPIIDetectionSummary,
  initiateRTBF,
  exportPrivacyAudit,
} from "@/lib/api";
import { useRTBFStatus } from "@/hooks/useRTBFStatus";
import type { PrivacyAuditLogEntry, PIIDetectionSummary } from "@/types";

const stagger = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
};

function KpiCard({
  label,
  value,
  index,
  badge,
}: {
  label: string;
  value: string | number;
  index: number;
  badge?: string;
}) {
  return (
    <motion.div
      custom={index}
      variants={stagger}
      initial="hidden"
      animate="show"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {badge && (
        <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {badge}
        </span>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

export default function PrivacyOperationsPage() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [orgInput, setOrgInput] = useState("");
  const [reason, setReason] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: auditLog = [] } = useQuery<PrivacyAuditLogEntry[]>({
    queryKey: ["privacy-audit-log"],
    queryFn: () => getPrivacyAuditLog(),
  });

  const { data: piiSummary = {} } = useQuery<PIIDetectionSummary>({
    queryKey: ["pii-detection-summary"],
    queryFn: getPIIDetectionSummary,
    refetchInterval: 30_000,
  });

  const rtbf = useRTBFStatus(requestId);

  const rtbfMutation = useMutation({
    mutationFn: () => initiateRTBF(phone, reason),
    onSuccess: (data) => {
      setRequestId(data.request_id);
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ["privacy-audit-log"] });
    },
  });

  const piiTotal = Object.values(piiSummary).reduce((a, b) => a + b, 0);
  const pending30d = auditLog.filter((e) => e.action === "erasure_initiated").length;
  const activeJurisdictions = [...new Set(auditLog.map((e) => e.jurisdiction).filter(Boolean))].length;

  const handleExport = async () => {
    const blob = await exportPrivacyAudit();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "privacy_audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Privacy Operations</h1>
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="RTBF Requests (30d)" value={pending30d} />
        <KpiCard index={1} label="PII Detections (24h)" value={piiTotal} badge={piiTotal > 0 ? "Active" : undefined} />
        <KpiCard
          index={2}
          label="Pending Erasures"
          value={auditLog.filter((e) => e.action === "erasure_initiated").length}
        />
        <KpiCard index={3} label="Active Jurisdictions" value={activeJurisdictions} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* RTBF initiation */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Initiate Erasure (RTBF)</h2>
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Phone (E.164, e.g. +923001234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Reason for erasure"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!phone || !reason}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              Initiate Erasure
            </button>
          </div>

          {/* Status tracker */}
          <AnimatePresence>
            {requestId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 rounded-lg bg-gray-50 p-3 text-sm"
              >
                <p className="font-medium text-gray-700">Request ID: <code className="text-xs">{requestId}</code></p>
                <p className="mt-1 flex items-center gap-2">
                  Status: <StatusBadge status={rtbf.status ?? "pending"} />
                  {rtbf.isLoading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />}
                </p>
                {rtbf.completedAt && (
                  <p className="mt-1 text-gray-500">Completed: {new Date(rtbf.completedAt).toLocaleString()}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PII detection summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">PII Detections (24h)</h2>
            <button onClick={handleExport} className="text-xs text-indigo-600 hover:underline">
              Export CSV
            </button>
          </div>
          {Object.keys(piiSummary).length === 0 ? (
            <p className="text-sm text-gray-500">No detections in the last 24 hours.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(piiSummary).map(([pattern, count]) => (
                <li key={pattern} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-medium capitalize text-gray-700">{pattern}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* RTBF audit log */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Privacy Audit Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Action</th>
                <th className="pb-2 pr-4">Subject Hash</th>
                <th className="pb-2 pr-4">Jurisdiction</th>
                <th className="pb-2 pr-4">Regulation</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.slice(0, 50).map((entry) => (
                <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <StatusBadge status={entry.action.replace(/_/g, " ")} />
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-gray-500">
                    {entry.subject_identifier.slice(0, 12)}…
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{entry.jurisdiction || "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{entry.regulation || "—"}</td>
                  <td className="py-2 text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditLog.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">No audit entries yet.</p>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-red-700">This action is irreversible</h3>
              <p className="mt-2 text-sm text-gray-600">
                All personal data for <strong>{phone}</strong> will be permanently erased, including
                messages, documents, and activity history.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rtbfMutation.mutate()}
                  disabled={rtbfMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {rtbfMutation.isPending ? "Processing…" : "Confirm Erasure"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
