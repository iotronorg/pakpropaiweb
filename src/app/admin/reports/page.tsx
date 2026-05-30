"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeadReport, getAgentReport, getPropertyReport, generateReport, getMyReports, downloadReport } from "@/lib/api";
import type { ReportType, Report } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";

type Period = "weekly" | "monthly";
type TrendPoint = { period: string; count: number };

function formatPeriodLabel(p: string, period: Period): string {
  if (period === "monthly") {
    const [year, month] = p.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  const d = new Date(p);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BarChart({ data, period, color = "blue" }: { data: TrendPoint[]; period: Period; color?: "blue" | "emerald" }) {
  if (!data.length) {
    return <p className="text-xs text-gray-400 py-4">No trend data yet</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  const barColor = color === "emerald" ? "bg-emerald-500" : "bg-blue-500";
  return (
    <div className="flex items-end gap-1.5 h-28 pt-2">
      {data.map((d) => (
        <div key={d.period} className="flex flex-col items-center flex-1 min-w-0 h-full justify-end">
          <span className="text-[10px] text-gray-500 font-medium mb-1">{d.count || ""}</span>
          <div
            className={`w-full rounded-t ${barColor} transition-all`}
            style={{ height: `${Math.max((d.count / max) * 80, d.count > 0 ? 4 : 0)}%` }}
            title={`${formatPeriodLabel(d.period, period)}: ${d.count}`}
          />
          <span className="text-[9px] text-gray-400 mt-1.5 truncate w-full text-center leading-tight">
            {formatPeriodLabel(d.period, period)}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
      {(["weekly", "monthly"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 capitalize transition-colors ${
            value === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray" | "blue"> = {
  ready:      "green",
  generating: "blue",
  pending:    "yellow",
  failed:     "red",
};

async function handleDownload(id: string, reportType: string) {
  const res = await downloadReport(id);
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `RealTron_Report_${reportType}_${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: "property_analysis", label: "Property Analysis", description: "AI audit of a specific property" },
  { value: "tax_advisory",      label: "Tax Advisory",      description: "Tax liability estimate (7E, CGT, WHT)" },
  { value: "loan_eligibility",  label: "Loan Eligibility",  description: "Bank financing eligibility check" },
  { value: "fraud_check",       label: "Fraud Check",       description: "Risk and fraud indicators for a property" },
];

function GenerateReportCard() {
  const qc = useQueryClient();
  const [selectedType,   setSelectedType]   = useState<ReportType>("property_analysis");
  const [propertyId,     setPropertyId]     = useState("");
  const [monthlyIncome,  setMonthlyIncome]  = useState("");
  const [propertyValue,  setPropertyValue]  = useState("");
  const [successMsg,     setSuccessMsg]     = useState("");

  const generateMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { report_type: selectedType };
      if (propertyId)    payload.property_id    = propertyId;
      if (monthlyIncome) payload.monthly_income = Number(monthlyIncome);
      if (propertyValue) payload.property_value = Number(propertyValue);
      return generateReport(payload as Parameters<typeof generateReport>[0]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-reports"] });
      setPropertyId(""); setMonthlyIncome(""); setPropertyValue("");
      setSuccessMsg("Report queued — it will appear below in Generated Reports when ready.");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate New Report</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Report Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ReportType)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            {REPORT_TYPES.find((t) => t.value === selectedType)?.description}
          </p>
        </div>
        {["property_analysis", "tax_advisory", "fraud_check"].includes(selectedType) && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Property ID (UUID)</label>
            <input
              type="text" placeholder="550e8400-e29b-41d4-a716…"
              value={propertyId} onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        {selectedType === "loan_eligibility" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Income</label>
              <input
                type="number" placeholder="e.g. 150000"
                value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Property Value</label>
              <input
                type="number" placeholder="e.g. 10000000"
                value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
        <div className="flex items-end">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {generateMutation.isPending ? "Queuing…" : "Generate Report"}
          </button>
        </div>
      </div>
      {successMsg && (
        <p className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{successMsg}</p>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>("weekly");

  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ["report-leads", period],
    queryFn: () => getLeadReport({ period }).then((r) => r.data),
  });

  const { data: agentData, isLoading: agentLoading } = useQuery({
    queryKey: ["report-agents"],
    queryFn: () => getAgentReport().then((r) => r.data),
  });

  const { data: propData, isLoading: propLoading } = useQuery({
    queryKey: ["report-properties", period],
    queryFn: () => getPropertyReport({ period }).then((r) => r.data),
  });

  const { data: myReports } = useQuery({
    queryKey: ["my-reports"],
    queryFn: () => getMyReports().then((r) => r.data),
    refetchInterval: 15000,
  });

  const isLoading = leadLoading || agentLoading || propLoading;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Analytics across leads, agents, and properties</p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <GenerateReportCard />

      {/* Generated Reports List */}
      {((myReports as Report[] | undefined) ?? []).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white mb-8 overflow-x-auto">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Generated Reports</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-start text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {((myReports as Report[] | undefined) ?? []).map((r: Report) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700 capitalize">{r.report_type.replace(/_/g, " ")}</td>
                  <td className="px-6 py-3">
                    <Badge label={r.status} variant={STATUS_COLOR[r.status] ?? "gray"} />
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-3">
                    {r.status === "ready" ? (
                      <button
                        onClick={() => handleDownload(r.id, r.report_type)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Download PDF
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-10">
          {/* Lead Analytics */}
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Lead Funnel</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <StatCard label="Total Leads" value={leadData?.total ?? 0} />
              <StatCard label="Hot Leads" value={leadData?.hot_leads ?? 0} sub="Score ≥ 70" />
              <StatCard label="Avg. Score" value={leadData?.avg_score ?? "—"} />
              <StatCard label="Sources" value={Object.keys(leadData?.by_source ?? {}).length} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {leadData?.trend && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 capitalize">
                    New Leads — {period === "weekly" ? "last 8 weeks" : "last 6 months"}
                  </h3>
                  <BarChart data={leadData.trend} period={period} />
                </div>
              )}

              {leadData?.by_status && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">By Status</h3>
                  <div className="space-y-2">
                    {Object.entries(leadData.by_status).map(([s, c]) => {
                      const total = leadData.total || 1;
                      const pct = Math.round((Number(c) / total) * 100);
                      return (
                        <div key={s}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="font-medium text-gray-700 capitalize">{s}</span>
                            <span className="text-gray-400">{String(c)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Property Stats */}
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Property Inventory</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <StatCard label="Total Active" value={propData?.total ?? 0} />
              <StatCard label="Avg AI Score" value={propData?.avg_ai_score ?? "—"} />
              <StatCard label="Installment Available" value={propData?.installment_available ?? 0} />
              <StatCard label="Cities" value={Object.keys(propData?.by_city ?? {}).length} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {propData?.trend && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 capitalize">
                    New Listings — {period === "weekly" ? "last 8 weeks" : "last 6 months"}
                  </h3>
                  <BarChart data={propData.trend} period={period} color="emerald" />
                </div>
              )}

              {propData?.by_risk_level && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">By Risk Level</h3>
                  <div className="flex gap-6">
                    {Object.entries(propData.by_risk_level).map(([level, count]) => (
                      <div key={level} className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{String(count)}</p>
                        <Badge
                          label={level}
                          variant={level === "high" ? "red" : level === "medium" ? "yellow" : "green"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Agent Performance */}
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Agent Performance</h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-start text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3">Agent</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Total Leads</th>
                    <th className="px-6 py-3">Closed Leads</th>
                    <th className="px-6 py-3">Deals</th>
                    <th className="px-6 py-3">Rating</th>
                    <th className="px-6 py-3">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(agentData?.results ?? []).map((a: {
                    id: number; name: string; phone: string; primary_city: string;
                    total_leads: number; closed_leads: number; closed_deals: number;
                    rating: number; is_verified: boolean;
                  }) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{a.phone}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{a.primary_city || "—"}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{a.total_leads}</td>
                      <td className="px-6 py-3 text-green-600">{a.closed_leads}</td>
                      <td className="px-6 py-3 text-blue-600">{a.closed_deals}</td>
                      <td className="px-6 py-3 text-gray-600">{a.rating?.toFixed(1) ?? "—"}</td>
                      <td className="px-6 py-3">
                        <Badge label={a.is_verified ? "Verified" : "Pending"} variant={a.is_verified ? "green" : "yellow"} />
                      </td>
                    </tr>
                  ))}
                  {(agentData?.results ?? []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-400">No agents found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
