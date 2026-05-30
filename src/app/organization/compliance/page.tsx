"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPrivacyAuditLog,
  getPIIDetectionSummary,
  initiateRTBF,
  getComplianceScreenings,
  exportComplianceReport,
} from "@/lib/api";
import { useRTBFStatus } from "@/hooks/useRTBFStatus";
import type { PIIDetectionSummary, PrivacyAuditLogEntry, SanctionScreeningResult } from "@/types";

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-gray-800">{title}</h2>;
}

export default function OrgCompliancePage() {
  const [rtbfPhone, setRtbfPhone] = useState("");
  const [rtbfReason, setRtbfReason] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const { data: piiSummary = {} } = useQuery<PIIDetectionSummary>({
    queryKey: ["org-pii-summary"],
    queryFn: getPIIDetectionSummary,
  });

  const { data: auditLog = [] } = useQuery<PrivacyAuditLogEntry[]>({
    queryKey: ["org-privacy-audit"],
    queryFn: () => getPrivacyAuditLog(),
  });

  const rtbf = useRTBFStatus(requestId);

  const rtbfMutation = useMutation({
    mutationFn: () => initiateRTBF(rtbfPhone, rtbfReason),
    onSuccess: (data) => setRequestId(data.request_id),
  });

  const { data: screenings = [] } = useQuery<SanctionScreeningResult[]>({
    queryKey: ["org-screenings"],
    queryFn: () => getComplianceScreenings(),
  });

  const toggle = (key: string) => setOpenSection((s) => (s === key ? null : key));

  const totalScreenings = screenings.length;
  const flaggedCount = screenings.filter((s) => s.status === "flagged").length;
  const blockedCount = screenings.filter((s) => s.status === "blocked").length;
  const clearRate = totalScreenings > 0
    ? Math.round(((totalScreenings - flaggedCount - blockedCount) / totalScreenings) * 100)
    : 100;

  const statusColor = (s: string) =>
    s === "blocked" ? "bg-red-100 text-red-700" :
    s === "flagged" ? "bg-amber-100 text-amber-700" :
    "bg-green-100 text-green-700";

  const handleExport = async () => {
    const blob = await exportComplianceReport();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "compliance_screenings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>

      {/* PII Detections accordion */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => toggle("pii")}
          className="flex w-full items-center justify-between px-5 py-4 text-start"
        >
          <SectionHeader title="PII Detection Feed (last 24h)" />
          <span className="text-gray-400">{openSection === "pii" ? "▲" : "▼"}</span>
        </button>
        <AnimatePresence>
          {openSection === "pii" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t px-5 py-4">
                {Object.keys(piiSummary).length === 0 ? (
                  <p className="text-sm text-gray-500">No PII detected in the last 24 hours.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(piiSummary).map(([pattern, count]) => (
                      <li
                        key={pattern}
                        className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="capitalize text-gray-700">{pattern}</span>
                        <span className="font-semibold text-red-600">{count} detected</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RTBF accordion */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => toggle("rtbf")}
          className="flex w-full items-center justify-between px-5 py-4 text-start"
        >
          <SectionHeader title="Right-to-Be-Forgotten Request" />
          <span className="text-gray-400">{openSection === "rtbf" ? "▲" : "▼"}</span>
        </button>
        <AnimatePresence>
          {openSection === "rtbf" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t px-5 py-4">
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Lead phone (E.164)"
                  value={rtbfPhone}
                  onChange={(e) => setRtbfPhone(e.target.value)}
                />
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reason"
                  rows={2}
                  value={rtbfReason}
                  onChange={(e) => setRtbfReason(e.target.value)}
                />
                <button
                  onClick={() => rtbfMutation.mutate()}
                  disabled={!rtbfPhone || !rtbfReason || rtbfMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {rtbfMutation.isPending ? "Submitting…" : "Submit Erasure Request"}
                </button>
                {requestId && (
                  <p className="text-sm text-gray-600">
                    Status:{" "}
                    <span className="font-medium">
                      {rtbf.status ?? "pending"}
                      {rtbf.isLoading && " …"}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audit log accordion */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => toggle("audit")}
          className="flex w-full items-center justify-between px-5 py-4 text-start"
        >
          <SectionHeader title="Privacy Audit Log" />
          <span className="text-gray-400">{openSection === "audit" ? "▲" : "▼"}</span>
        </button>
        <AnimatePresence>
          {openSection === "audit" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t px-5 py-4">
                {auditLog.length === 0 ? (
                  <p className="text-sm text-gray-500">No audit entries.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {auditLog.slice(0, 20).map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <span className="font-medium capitalize text-gray-700">
                            {entry.action.replace(/_/g, " ")}
                          </span>
                          <span className="ms-2 text-xs text-gray-400">{entry.jurisdiction}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* AML Screening section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => toggle("aml")}
          className="flex w-full items-center justify-between px-5 py-4 text-start"
        >
          <SectionHeader title="AML Screening" />
          <span className="text-gray-400">{openSection === "aml" ? "▲" : "▼"}</span>
        </button>
        <AnimatePresence>
          {openSection === "aml" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t px-5 py-4 space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total", value: totalScreenings },
                    { label: "Flagged", value: flaggedCount, color: "text-amber-600" },
                    { label: "Blocked", value: blockedCount, color: "text-red-600" },
                    { label: "Clear Rate", value: `${clearRate}%`, color: "text-green-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg bg-gray-50 p-3 text-center">
                      <div className={`text-2xl font-bold ${color || "text-gray-900"}`}>{value}</div>
                      <div className="text-xs text-gray-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Screenings table */}
                {screenings.length === 0 ? (
                  <p className="text-sm text-gray-500">No screening records.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-start text-xs text-gray-500">
                          <th className="pb-2 pe-4">Name</th>
                          <th className="pb-2 pe-4">List</th>
                          <th className="pb-2 pe-4">Match</th>
                          <th className="pb-2 pe-4">Risk</th>
                          <th className="pb-2 pe-4">Status</th>
                          <th className="pb-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {screenings.slice(0, 20).map((sr) => (
                          <tr key={sr.screening_id}>
                            <td className="py-2 pe-4 font-medium text-gray-800">{sr.screened_name}</td>
                            <td className="py-2 pe-4 text-gray-600">{sr.list_source || "—"}</td>
                            <td className="py-2 pe-4 text-gray-600 capitalize">{sr.match_type || "—"}</td>
                            <td className="py-2 pe-4 text-gray-600">{sr.risk_score}</td>
                            <td className="py-2 pe-4">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(sr.status)}`}>
                                {sr.status}
                              </span>
                            </td>
                            <td className="py-2 text-xs text-gray-400">
                              {new Date(sr.screened_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={handleExport}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  Export CSV
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
