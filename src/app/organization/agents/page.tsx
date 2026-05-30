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
        <h1 className="text-2xl font-bold text-gray-900">Agent Performance</h1>
        <p className="mt-1 text-sm text-gray-500">Agents ranked by conversion rate</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : results.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No approved agents yet —{" "}
            <Link href="/organization/team" className="text-blue-600 hover:underline">
              add agents from the Team page
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Rank", "Agent", "Leads", "Conversion", "Avg Response", "Closed Deals", "Rating", "action"].map((h) => (
                    <th key={h} className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                      {h !== "action" ? h : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((a) => (
                  <tr key={a.agent_id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        a.rank === 1 ? "bg-yellow-100 text-yellow-700"
                        : a.rank === 2 ? "bg-gray-100 text-gray-600"
                        : a.rank === 3 ? "bg-orange-100 text-orange-700"
                        : "bg-gray-50 text-gray-400"
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
                        <span className="font-medium text-gray-900">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-gray-600">{a.total_leads}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${Math.max(0, Math.min(a.conversion_rate, 100))}%` }}
                          />
                        </div>
                        <span className="font-medium tabular-nums text-gray-700">
                          {a.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-gray-600">
                      {a.avg_response_time_hours != null ? `${a.avg_response_time_hours}h` : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-gray-600">{a.closed_deals}</td>
                    <td className="px-5 py-3">
                      {a.rating > 0
                        ? <span className="tabular-nums">⭐ {a.rating.toFixed(1)}</span>
                        : <span className="text-gray-400">—</span>}
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
