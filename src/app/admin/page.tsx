"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Property } from "@/types";

export default function AdminOverview() {
  const { data: propsData, isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: () => api.get("/properties/").then((r) => r.data),
  });

  const properties: Property[] = propsData?.results ?? [];
  const total = propsData?.count ?? 0;
  const verified = properties.filter((p) => p.legal_status === "verified").length;
  const unverified = properties.filter((p) => p.legal_status !== "verified").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="mt-1 text-sm text-gray-500">System health and activity at a glance</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
            <StatsCard label="Total Properties" value={total} color="blue" />
            <StatsCard label="Verified" value={verified} color="green" />
            <StatsCard label="Unverified" value={unverified} color="yellow" />
            <StatsCard label="Pending Review" value={unverified} sub="Needs attention" color="red" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-800">Recent Listings</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {properties.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.title || `Property #${p.id}`}</p>
                    <p className="text-xs text-gray-400">{p.city} · {formatDate(p.created_at)}</p>
                  </div>
                  <Badge
                    label={p.legal_status}
                    variant={p.legal_status === "verified" ? "green" : p.legal_status === "disputed" ? "red" : "yellow"}
                  />
                </div>
              ))}
              {properties.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No properties yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
