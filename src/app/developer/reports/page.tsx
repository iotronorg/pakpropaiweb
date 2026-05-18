"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyReports, generateReport, getLeadReport, getPropertyReport, downloadReport } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Report, ReportType } from "@/types";

type Period = "weekly" | "monthly";
type TrendPoint = { period: string; count: number };

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: "property_analysis", label: "Property Analysis", description: "AI audit of a specific property" },
  { value: "tax_advisory", label: "Tax Advisory", description: "Tax liability estimate (7E, CGT, WHT)" },
  { value: "loan_eligibility", label: "Loan Eligibility", description: "Bank financing eligibility check" },
  { value: "fraud_check", label: "Fraud Check", description: "Risk and fraud indicators for a property" },
];

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray" | "blue"> = {
  ready:      "green",
  generating: "blue",
  pending:    "yellow",
  failed:     "red",
};

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
    <div className="flex items-end gap-1.5 h-24 pt-2">
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

async function handleDownload(id: string, reportType: string) {
  const res = await downloadReport(id);
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `RealTron_Report_${reportType}_${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DeveloperReportsPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("weekly");
  const [selectedType, setSelectedType] = useState<ReportType>("tax_advisory");
  const [propertyId, setPropertyId] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [propertyValue, setPropertyValue] = useState("");

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["my-reports"],
    queryFn: () => getMyReports().then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: leadData } = useQuery({
    queryKey: ["report-leads", period],
    queryFn: () => getLeadReport({ period }).then((r) => r.data),
  });

  const { data: propData } = useQuery({
    queryKey: ["report-properties", period],
    queryFn: () => getPropertyReport({ period }).then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { report_type: selectedType };
      if (propertyId) payload.property_id = propertyId;
      if (monthlyIncome) payload.monthly_income = Number(monthlyIncome);
      if (propertyValue) payload.property_value = Number(propertyValue);
      return generateReport(payload as Parameters<typeof generateReport>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      setPropertyId("");
      setMonthlyIncome("");
      setPropertyValue("");
    },
  });

  const reports: Report[] = reportsData ?? [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Generate AI-powered property and financial reports</p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 capitalize">
            New Leads — {period === "weekly" ? "last 8 weeks" : "last 6 months"}
          </h3>
          {leadData?.trend ? (
            <BarChart data={leadData.trend} period={period} />
          ) : (
            <p className="text-xs text-gray-400 py-4">Loading…</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 capitalize">
            New Listings — {period === "weekly" ? "last 8 weeks" : "last 6 months"}
          </h3>
          {propData?.trend ? (
            <BarChart data={propData.trend} period={period} color="emerald" />
          ) : (
            <p className="text-xs text-gray-400 py-4">Loading…</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate New Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Report Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ReportType)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  {REPORT_TYPES.find((t) => t.value === selectedType)?.description}
                </p>
              </div>

              {["property_analysis", "tax_advisory", "fraud_check"].includes(selectedType) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Property ID (UUID)</label>
                  <input
                    type="text"
                    placeholder="e.g. 550e8400-e29b-41d4-a716..."
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedType === "loan_eligibility" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Income (PKR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150000"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Property Value (PKR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000000"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generateMutation.isPending ? "Generating..." : "Generate Report"}
              </button>
              {generateMutation.isError && (
                <p className="text-xs text-red-500">Failed to generate report. Please try again.</p>
              )}
              {generateMutation.isSuccess && (
                <p className="text-xs text-green-600">Report queued — it will be ready shortly.</p>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-xl font-bold text-gray-800">{leadData?.total ?? "—"}</p>
              <p className="text-xs text-gray-500">Total Leads</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-xl font-bold text-gray-800">{propData?.total ?? "—"}</p>
              <p className="text-xs text-gray-500">Active Properties</p>
            </div>
          </div>
        </div>

        {/* Report history */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-800">My Reports</h2>
              <p className="text-xs text-gray-400 mt-0.5">Auto-refreshes every 5 seconds for pending reports</p>
            </div>
            {isLoading ? (
              <div className="p-8 flex justify-center"><LoadingSpinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Ready At</th>
                    <th className="px-6 py-3">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="capitalize font-medium text-gray-700">
                          {r.report_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <Badge label={r.status} variant={STATUS_COLOR[r.status] ?? "gray"} />
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {r.ready_at ? formatDate(r.ready_at) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {r.status === "ready" ? (
                          <button
                            onClick={() => handleDownload(r.id, r.report_type)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Download PDF
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No reports yet — generate your first one
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
