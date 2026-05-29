"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  getComplianceScreenings,
  getComplianceSanctions,
  createComplianceSanction,
  deleteComplianceSanction,
  exportComplianceReport,
} from "@/lib/api";
import type { SanctionScreeningResult, ComplianceSanctionRecord } from "@/types";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const statusColor = (s: string) =>
  s === "blocked"  ? "bg-red-100 text-red-700"    :
  s === "flagged"  ? "bg-amber-100 text-amber-700" :
                     "bg-green-100 text-green-700";

const riskColor = (r: string) =>
  r === "high"   ? "text-red-600"   :
  r === "medium" ? "text-amber-600" :
                   "text-green-600";

export default function AdminCompliancePage() {
  const qc = useQueryClient();
  const [newSanction, setNewSanction] = useState({
    name: "", id_number: "", id_type: "cnic",
    list_source: "LOCAL", risk_level: "high",
  });
  const [orgFilter, setOrgFilter] = useState("");

  const { data: screenings = [] } = useQuery<SanctionScreeningResult[]>({
    queryKey: ["admin-screenings"],
    queryFn: () => getComplianceScreenings(),
    staleTime: 30_000,
  });

  const { data: sanctions = [] } = useQuery<ComplianceSanctionRecord[]>({
    queryKey: ["admin-sanctions"],
    queryFn: getComplianceSanctions,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => createComplianceSanction(newSanction),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sanctions"] });
      setNewSanction({ name: "", id_number: "", id_type: "cnic", list_source: "LOCAL", risk_level: "high" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComplianceSanction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sanctions"] }),
  });

  const totalScreenings = screenings.length;
  const flaggedCount    = screenings.filter((s) => s.status === "flagged").length;
  const blockedCount    = screenings.filter((s) => s.status === "blocked").length;
  const clearRate       = totalScreenings > 0
    ? Math.round(((totalScreenings - flaggedCount - blockedCount) / totalScreenings) * 100)
    : 100;

  const handleExport = async () => {
    const blob = await exportComplianceReport(orgFilter || undefined);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "compliance_screenings.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>

      {/* KPI cards */}
      <motion.div
        variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-4 gap-4"
      >
        {[
          { label: "Total Screenings", value: totalScreenings, color: "text-gray-900" },
          { label: "Flagged",          value: flaggedCount,    color: "text-amber-600" },
          { label: "Blocked",          value: blockedCount,    color: "text-red-600" },
          { label: "Clear Rate",       value: `${clearRate}%`, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <motion.div key={label} variants={item} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="mt-1 text-sm text-gray-500">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Screening history */}
      <motion.div
        variants={stagger} initial="hidden" animate="visible"
        className="rounded-xl border bg-white shadow-sm"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold text-gray-800">All-Org Screening History</h2>
          <div className="flex gap-2">
            <input
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              placeholder="Org UUID for export filter"
              className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleExport}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto px-5 py-4">
          {screenings.length === 0 ? (
            <p className="text-sm text-gray-500">No screening records.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Org</th>
                  <th className="pb-2 pr-4">List</th>
                  <th className="pb-2 pr-4">Match</th>
                  <th className="pb-2 pr-4">Risk</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {screenings.map((sr) => (
                  <motion.tr key={sr.screening_id} variants={item}>
                    <td className="py-2 pr-4 font-medium text-gray-800">{sr.screened_name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-500">{sr.org_id?.slice(0, 8) || "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{sr.list_source || "—"}</td>
                    <td className="py-2 pr-4 capitalize text-gray-600">{sr.match_type || "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{sr.risk_score}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(sr.status)}`}>
                        {sr.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-gray-400">
                      {new Date(sr.screened_at).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Sanction list management */}
      <motion.div
        variants={stagger} initial="hidden" animate="visible"
        className="rounded-xl border bg-white shadow-sm"
      >
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-gray-800">Sanction List Management</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Add record form */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4">
            <input
              value={newSanction.name}
              onChange={(e) => setNewSanction((s) => ({ ...s, name: e.target.value }))}
              placeholder="Name *"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              value={newSanction.id_number}
              onChange={(e) => setNewSanction((s) => ({ ...s, id_number: e.target.value }))}
              placeholder="ID Number (optional — stored hashed)"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={newSanction.id_type}
              onChange={(e) => setNewSanction((s) => ({ ...s, id_type: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="cnic">CNIC</option>
              <option value="passport">Passport</option>
              <option value="company_reg">Company Reg</option>
            </select>
            <select
              value={newSanction.list_source}
              onChange={(e) => setNewSanction((s) => ({ ...s, list_source: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="LOCAL">LOCAL</option>
              <option value="OFAC">OFAC</option>
              <option value="UN">UN</option>
              <option value="EU">EU</option>
              <option value="FBR_CBR">FBR/CBR</option>
            </select>
            <select
              value={newSanction.risk_level}
              onChange={(e) => setNewSanction((s) => ({ ...s, risk_level: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newSanction.name || createMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              {createMutation.isPending ? "Adding…" : "Add to Sanction List"}
            </button>
          </div>

          {/* Existing records */}
          {sanctions.length === 0 ? (
            <p className="text-sm text-gray-500">No sanction records.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">List</th>
                  <th className="pb-2 pr-4">Risk</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sanctions.map((rec) => (
                  <motion.tr key={rec.id} variants={item}>
                    <td className="py-2 pr-4 font-medium text-gray-800">{rec.name}</td>
                    <td className="py-2 pr-4 uppercase text-xs text-gray-500">{rec.id_type || "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{rec.list_source}</td>
                    <td className={`py-2 pr-4 font-semibold text-sm ${riskColor(rec.risk_level)}`}>
                      {rec.risk_level}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => deleteMutation.mutate(rec.id)}
                        className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition"
                      >
                        Deactivate
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
