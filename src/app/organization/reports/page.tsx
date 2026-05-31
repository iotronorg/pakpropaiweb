"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyReports, generateReport, downloadReport, getMonthlyReports } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Report, ReportType, MonthlyReport } from "@/types";

const REPORT_OPTIONS: { type: ReportType; label: string; desc: string }[] = [
  {
    type:  "property_analysis",
    label: "Property Analysis",
    desc:  "AI-generated risk, ownership, and market analysis for a listing",
  },
  {
    type:  "tax_advisory",
    label: "Tax Advisory",
    desc:  "Capital gains, rental income, and regional tax guidance",
  },
  {
    type:  "loan_eligibility",
    label: "Loan Eligibility",
    desc:  "Mortgage eligibility, EMI estimates, and financing options",
  },
  {
    type:  "fraud_check",
    label: "Fraud Check",
    desc:  "AI scam risk score, fraud indicator analysis",
  },
];

const STATUS_VARIANT: Record<string, "green" | "yellow" | "gray" | "red"> = {
  ready:      "green",
  generating: "yellow",
  pending:    "yellow",
  failed:     "red",
};

function formatPeriod(periodStart: string): string {
  const d = new Date(periodStart + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function OrgReportsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["org-reports"],
    queryFn: () => getMyReports().then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly-reports"],
    queryFn: () => getMonthlyReports().then((r) => r.data),
  });

  const genMutation = useMutation({
    mutationFn: (type: ReportType) => generateReport({ report_type: type }),
    onSuccess: () => refetch(),
  });

  const reports: Report[] = data ?? [];

  async function handleDownload(id: string) {
    const res = await downloadReport(id);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement("a");
    a.href    = url;
    a.download = `report-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const monthlyReports: MonthlyReport[] = monthlyData ?? [];

  return (
    <div className="space-y-7 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Generate AI-powered analytics reports for your organization</p>
      </div>

      {/* Monthly Reports Archive */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Monthly Reports</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Auto-generated on the 1st of each month</p>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{monthlyReports.length} reports</span>
        </div>
        {monthlyLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : monthlyReports.length === 0 ? (
          <p className="text-center py-10 text-sm text-[var(--text-muted)]">
            No monthly reports yet — the first one generates on the 1st of next month
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Period", "Status", "Generated On", "Download"].map((h) => (
                    <th key={h} className="px-5 py-3 text-start text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {monthlyReports.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-muted)]/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                      {formatPeriod(r.period_start)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge label={r.status} variant={STATUS_VARIANT[r.status] ?? "gray"} />
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs tabular-nums">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      {r.status === "ready" && r.pdf_url ? (
                        <a
                          href={r.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Download PDF
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          {r.status === "generating" || r.status === "pending" ? "Generating…" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {REPORT_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => genMutation.mutate(opt.type)}
            disabled={genMutation.isPending}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-start hover:border-blue-200 hover:bg-blue-50/30 transition-colors group disabled:opacity-50"
          >
            <p className="font-semibold text-[var(--text-primary)] group-hover:text-blue-700 transition-colors">
              {opt.label}
            </p>
            <p className="mt-1.5 text-xs text-[var(--text-muted)] leading-snug">{opt.desc}</p>
            <span className="mt-3 inline-block text-xs font-medium text-blue-600">
              {genMutation.isPending ? "Queuing…" : "Generate →"}
            </span>
          </button>
        ))}
      </div>

      {/* History */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Generated Reports</h2>
          <span className="text-xs text-[var(--text-muted)]">{reports.length} reports</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-center py-12 text-sm text-[var(--text-muted)]">No reports yet — generate one above</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Type", "Status", "Created", "Ready At", "Action"].map((h) => (
                    <th key={h} className="px-5 py-3 text-start text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-muted)]/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)] capitalize">
                      {r.report_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3">
                      <Badge label={r.status} variant={STATUS_VARIANT[r.status] ?? "gray"} />
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs tabular-nums">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs tabular-nums">
                      {r.ready_at
                        ? new Date(r.ready_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {r.status === "ready" ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(r.id)}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Download PDF
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          {r.status === "generating" || r.status === "pending"
                            ? "Generating…"
                            : r.status === "failed"
                            ? "Failed"
                            : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
