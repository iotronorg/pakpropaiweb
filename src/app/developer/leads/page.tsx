"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeads } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatPKR } from "@/lib/utils";
import type { Lead } from "@/types";

export default function DeveloperLeadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dev-leads"],
    queryFn: () => getLeads().then((r) => r.data).catch(() => ({ results: [], count: 0 })),
  });

  const leads: Lead[] = data?.results ?? [];
  const hot = leads.filter((l) => (l.intent_score ?? 0) >= 7);
  const warm = leads.filter((l) => (l.intent_score ?? 0) >= 4 && (l.intent_score ?? 0) < 7);
  const cold = leads.filter((l) => (l.intent_score ?? 0) < 4);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lead Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Buyer interest and intent breakdown</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
              <p className="text-3xl font-bold text-green-700">{hot.length}</p>
              <p className="text-sm text-green-600 mt-1">Hot Leads</p>
              <p className="text-xs text-green-500">Intent ≥ 7/10</p>
            </div>
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center">
              <p className="text-3xl font-bold text-yellow-700">{warm.length}</p>
              <p className="text-sm text-yellow-600 mt-1">Warm Leads</p>
              <p className="text-xs text-yellow-500">Intent 4–6/10</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
              <p className="text-3xl font-bold text-gray-600">{cold.length}</p>
              <p className="text-sm text-gray-500 mt-1">Cold Leads</p>
              <p className="text-xs text-gray-400">Intent &lt; 4/10</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-800">All Leads</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Intent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{l.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400 font-mono">{l.phone}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{l.location_interest || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{l.budget_max ? formatPKR(l.budget_max) : "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`font-bold text-sm ${
                        (l.intent_score ?? 0) >= 7 ? "text-green-600"
                          : (l.intent_score ?? 0) >= 4 ? "text-yellow-600"
                          : "text-gray-400"
                      }`}>
                        {l.intent_score !== null ? `${l.intent_score}/10` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        label={l.status}
                        variant={
                          l.status === "qualified" ? "green"
                            : l.status === "cold" ? "gray"
                            : "yellow"
                        }
                      />
                    </td>
                    <td className="px-6 py-3 text-gray-400">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No leads yet — they appear when buyers engage via WhatsApp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
