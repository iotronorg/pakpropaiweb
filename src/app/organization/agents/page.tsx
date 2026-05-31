"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAgentLeaderboard } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AgentLeaderboardEntry } from "@/types";

export default function OrgAgentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["agent-leaderboard"],
    queryFn: () => getAgentLeaderboard().then((r) => r.data),
  });

  const results: AgentLeaderboardEntry[] = data?.results ?? [];

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        Failed to load agent performance data. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agent Performance</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Agents ranked by conversion rate</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : results.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--text-muted)]">
            No approved agents yet —{" "}
            <Link href="/organization/team" className="text-blue-600 hover:underline">
              add agents from the Team page
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Rank", "Agent", "Leads", "Conversion", "Avg Response", "Closed Deals", "Rating", "action"].map((h) => (
                    <th key={h} className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">
                      {h !== "action" ? h : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {results.map((a) => (
                  <tr key={a.agent_id} className="transition-colors hover:bg-[var(--bg-muted)]/50">
                    <td className="px-5 py-3">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        a.rank === 1 ? "bg-yellow-100 text-yellow-700"
                        : a.rank === 2 ? "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                        : a.rank === 3 ? "bg-orange-100 text-orange-700"
                        : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                      }`}>
                        {a.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-xs font-bold text-blue-600">
                            {a.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-[var(--text-primary)]">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-[var(--text-muted)]">{a.total_leads}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-[var(--bg-subtle)]">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${Math.max(0, Math.min(a.conversion_rate, 100))}%` }}
                          />
                        </div>
                        <span className="font-medium tabular-nums text-[var(--text-muted)]">
                          {a.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-[var(--text-muted)]">
                      {a.avg_response_time_hours != null ? `${a.avg_response_time_hours}h` : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-[var(--text-muted)]">{a.closed_deals}</td>
                    <td className="px-5 py-3">
                      {a.rating > 0
                        ? <span className="tabular-nums">⭐ {a.rating.toFixed(1)}</span>
                        : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/organization/agents/${a.agent_id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        View →
                      </Link>
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
