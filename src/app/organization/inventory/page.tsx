"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProperties, getPropertyReport } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { StatCard, BreakdownBar, ChartCard, BarChart, type Period, type TrendPoint } from "@/components/ui/Charts";
import type { Property, PropertyReportData } from "@/types";

const LEGAL_VARIANT: Record<string, "green" | "yellow" | "red" | "gray"> = {
  verified:   "green",
  pending:    "yellow",
  disputed:   "red",
  unverified: "gray",
};

const RISK_COLOR: Record<string, string> = {
  low:    "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  high:   "text-red-600 bg-red-50",
};

export default function OrgInventoryPage() {
  const [search,    setSearch]    = useState("");
  const [typeFilter, setType]     = useState("");
  const [legalFilter, setLegal]   = useState("");
  const [period, setPeriod]       = useState<Period>("monthly");

  const { data: propResponse, isLoading: l1 } = useQuery({
    queryKey: ["org-inventory"],
    queryFn: () => getProperties().then((r) => r.data),
  });

  const { data: reportData, isLoading: l2 } = useQuery({
    queryKey: ["org-property-report", period],
    queryFn: () => getPropertyReport({ period }).then((r) => r.data as PropertyReportData),
  });

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const allProperties: Property[] = propResponse?.results ?? propResponse ?? [];
  const report = reportData ?? {
    total: 0, avg_ai_score: 0, installment_available: 0,
    by_type: {}, by_legal_status: {}, by_risk_level: {}, by_city: {},
  };
  const trend: TrendPoint[] = report.trend ?? [];

  const filtered = allProperties.filter((p) => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.ref_no.toLowerCase().includes(search.toLowerCase());
    const matchType  = !typeFilter  || p.property_type === typeFilter;
    const matchLegal = !legalFilter || p.legal_status  === legalFilter;
    return matchSearch && matchType && matchLegal;
  });

  const types  = [...new Set(allProperties.map((p) => p.property_type).filter(Boolean))];
  const legals = ["verified", "pending", "unverified", "disputed"];

  return (
    <div className="space-y-7 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">Your organization's property portfolio</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Listings"       value={report.total}                accent="blue"    icon="🏠" />
        <StatCard label="Verified"             value={report.by_legal_status?.verified ?? 0} accent="emerald" icon="✅" sub="Legally confirmed" />
        <StatCard label="Installment Plans"    value={report.installment_available} accent="violet"  icon="📅" />
        <StatCard label="Avg AI Score"         value={`${report.avg_ai_score}/100`} accent="amber"   icon="🤖" />
      </div>

      {/* Distribution row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">By Property Type</h3>
          {Object.keys(report.by_type).length > 0
            ? <BreakdownBar data={report.by_type} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Legal Status</h3>
          {Object.keys(report.by_legal_status).length > 0
            ? <BreakdownBar data={report.by_legal_status} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Cities</h3>
          {Object.keys(report.by_city).length > 0
            ? <BreakdownBar data={report.by_city} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
      </div>

      {/* Trend chart */}
      {trend.length > 0 && (
        <ChartCard title="Inventory Growth" period={period} onPeriodChange={setPeriod}>
          <BarChart data={trend} period={period} color="emerald" height={28} />
        </ChartCard>
      )}

      {/* Filters + Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-800 mr-auto">All Listings</h2>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by title, city, ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 w-52"
          />

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>

          {/* Legal filter */}
          <select
            value={legalFilter}
            onChange={(e) => setLegal(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Legal</option>
            {legals.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <span className="text-xs text-gray-400">{filtered.length} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Ref", "Title", "City", "Type", "Price", "AI Score", "Risk", "Legal", "Agent", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-400">
                    {allProperties.length === 0
                      ? "No inventory yet — add properties to get started"
                      : "No results match your filters"}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{p.ref_no}</td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <p className="font-medium text-gray-900 truncate">{p.title}</p>
                      {p.area_marla && (
                        <p className="text-xs text-gray-400">{p.area_marla} Marla</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{p.city}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize whitespace-nowrap">
                      {p.property_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums">
                      {p.price_pkr
                        ? <span className="font-medium text-gray-800">
                            {p.price_pkr >= 10_000_000
                              ? `${(p.price_pkr / 10_000_000).toFixed(1)}Cr`
                              : p.price_pkr >= 100_000
                              ? `${(p.price_pkr / 100_000).toFixed(1)}L`
                              : p.price_pkr.toLocaleString()}
                          </span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {p.ai_score !== null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full bg-gray-100">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                p.ai_score >= 70 ? "bg-emerald-500"
                                : p.ai_score >= 40 ? "bg-amber-400"
                                : "bg-red-400"
                              }`}
                              style={{ width: `${p.ai_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums text-gray-700">{p.ai_score}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.risk_level ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${RISK_COLOR[p.risk_level] ?? "text-gray-500 bg-gray-50"}`}>
                          {p.risk_level}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 capitalize">
                      <Badge
                        label={p.legal_status}
                        variant={LEGAL_VARIANT[p.legal_status] ?? "gray"}
                      />
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.owner_phone ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        label={p.is_active ? "Active" : "Inactive"}
                        variant={p.is_active ? "green" : "gray"}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
