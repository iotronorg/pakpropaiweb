"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAudits, downloadAudit } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { SlidersHorizontal } from "lucide-react";

interface AuditRecord {
  id: number;
  phone: string;
  city: string;
  location: string;
  property_type: string;
  area_marla: number | null;
  estimated_value_pkr: number;
  risk_score: number;
  investment_grade: string;
  liquidity_score: number;
  has_pdf: boolean;
  created_at: string;
}

const GRADE_COLOR: Record<string, "green" | "blue" | "yellow" | "red"> = {
  A: "green",
  B: "blue",
  C: "yellow",
  D: "red",
};

function riskColor(score: number): string {
  if (score <= 3) return "text-green-600";
  if (score <= 6) return "text-yellow-600";
  return "text-red-600";
}

function formatValue(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString();
}

async function handleDownload(id: number) {
  const res = await downloadAudit(id);
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `RealTron_Audit_${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditPage() {
  const { data, isLoading } = useQuery<AuditRecord[]>({
    queryKey: ["admin-audits"],
    queryFn: () => getAudits().then((r) => r.data),
  });

  const audits = data ?? [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Property Audit Log</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            AI-generated property audits — risk scores, investment grades, and PDF reports
          </p>
        </div>
        <Link
          href="/admin/audit/benchmarks"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors"
        >
          <SlidersHorizontal size={14} />
          Market Benchmarks
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">Liquidity</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {audits.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--bg-muted)]">
                  <td className="px-5 py-3">
                    <p className="font-medium text-[var(--text-primary)] capitalize">{a.property_type}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-[180px]">
                      {a.location}, {a.city}
                    </p>
                    {a.area_marla && (
                      <p className="text-[11px] text-[var(--text-muted)]">{a.area_marla} sqm</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] font-mono text-xs">{a.phone || "—"}</td>
                  <td className="px-5 py-3 text-[var(--text-muted)] font-medium">{formatValue(a.estimated_value_pkr)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-bold text-base ${riskColor(a.risk_score)}`}>
                      {a.risk_score}
                    </span>
                    <span className="text-[var(--text-muted)] text-xs">/10</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      label={`Grade ${a.investment_grade}`}
                      variant={GRADE_COLOR[a.investment_grade] ?? "gray"}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${(a.liquidity_score / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{a.liquidity_score}/10</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                    {formatDate(a.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    {a.has_pdf ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(a.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-[var(--text-faint)] text-xs">No PDF</span>
                    )}
                  </td>
                </tr>
              ))}
              {audits.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No property audits yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
