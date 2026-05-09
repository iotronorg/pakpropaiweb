"use client";

import { useQuery } from "@tanstack/react-query";
import { getDuplicateLeads } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";

interface DuplicateLead {
  id: string;
  phone: string;
  status: string;
  intent: string;
  created_at: string;
}

interface DuplicateGroup {
  normalized_phone: string;
  leads: DuplicateLead[];
}

const STATUS_COLOR: Record<string, string> = {
  new:           "bg-blue-50 text-blue-700",
  contacted:     "bg-yellow-50 text-yellow-700",
  interested:    "bg-green-50 text-green-700",
  cold:          "bg-gray-100 text-gray-500",
  spam:          "bg-red-50 text-red-600",
  closed_won:    "bg-emerald-50 text-emerald-700",
  closed_lost:   "bg-gray-100 text-gray-500",
  unresponsive:  "bg-orange-50 text-orange-600",
};

export default function AdminDuplicateLeadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-duplicate-leads"],
    queryFn: () => getDuplicateLeads().then((r) => r.data),
  });

  const groups: DuplicateGroup[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Duplicate Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lead pairs that share the same normalized phone number — likely the same person.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-gray-400">No duplicate leads detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">{data?.count ?? groups.length} duplicate group(s) found</p>
          {groups.map((group, i) => (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-amber-100 bg-amber-50">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Duplicate Group</span>
                <span className="font-mono text-sm text-amber-800">{group.normalized_phone}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-amber-100">
                    <th className="px-5 py-2">Lead ID</th>
                    <th className="px-5 py-2">Phone (raw)</th>
                    <th className="px-5 py-2">Status</th>
                    <th className="px-5 py-2">Intent</th>
                    <th className="px-5 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {group.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-amber-50/50">
                      <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{lead.id.slice(0, 8)}…</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-gray-700">{lead.phone}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {lead.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-600 capitalize">{lead.intent || "—"}</td>
                      <td className="px-5 py-2.5 text-gray-400 text-xs">{formatDate(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
