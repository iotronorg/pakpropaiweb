"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProperties, updateProperty, rescoreProperty, rescoreAllProperties } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatPKR, formatDate } from "@/lib/utils";
import { Property } from "@/types";

export default function PropertiesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-properties", search],
    queryFn: () => getProperties(search ? { search } : undefined).then((r) => r.data),
  });

  const [rescoreMsg, setRescoreMsg] = useState<string | null>(null);

  const verify = useMutation({
    mutationFn: (id: string) => updateProperty(id, { legal_status: "verified" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-properties"] }),
  });

  const rescore = useMutation({
    mutationFn: (id: string) => rescoreProperty(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-properties"] }),
  });

  const rescoreAll = useMutation({
    mutationFn: () => rescoreAllProperties(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      setRescoreMsg("All properties queued for rescoring.");
      setTimeout(() => setRescoreMsg(null), 4000);
    },
  });

  const properties: Property[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
            <p className="mt-1 text-sm text-gray-500">Moderate, verify, and rescore property listings</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties…"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56"
            />
            <button
              onClick={() => rescoreAll.mutate()}
              disabled={rescoreAll.isPending}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {rescoreAll.isPending ? "Rescoring…" : "Rescore All"}
            </button>
          </div>
        </div>
        {rescoreMsg && (
          <p className="text-sm text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-4 py-2">
            {rescoreMsg}
          </p>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">AI Score</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Listed</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {p.title || `Property #${p.id}`}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.city}</td>
                  <td className="px-5 py-3 text-gray-700">{p.price_pkr ? formatPKR(p.price_pkr) : "—"}</td>
                  <td className="px-5 py-3">
                    <Badge label={p.property_type} />
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {p.ai_score !== null ? `${p.ai_score}/100` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      label={p.legal_status}
                      variant={p.legal_status === "verified" ? "green" : p.legal_status === "disputed" ? "red" : "yellow"}
                    />
                  </td>
                  <td className="px-5 py-3 text-gray-400">{formatDate(p.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {p.legal_status !== "verified" && (
                        <button
                          onClick={() => verify.mutate(p.id)}
                          disabled={verify.isPending}
                          className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => rescore.mutate(p.id)}
                        disabled={rescore.isPending}
                        className="rounded-md bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-200 disabled:opacity-50 transition-colors"
                      >
                        Rescore
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">No properties found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
