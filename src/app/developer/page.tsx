"use client";

import { useQuery } from "@tanstack/react-query";
import { getProperties } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuthStore } from "@/store/auth";
import { Property } from "@/types";

export default function DeveloperOverview() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dev-properties"],
    queryFn: () => getProperties().then((r) => r.data),
  });

  const properties: Property[] = data?.results ?? [];
  const totalUnits = data?.count ?? 0;
  const available = properties.filter((p) => p.legal_status !== "disputed").length;
  const verified = properties.filter((p) => p.legal_status === "verified").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Project inventory and lead performance for {user?.name || user?.phone}</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-8">
            <StatsCard label="Total Inventory" value={totalUnits} color="blue" />
            <StatsCard label="For Sale" value={available} color="green" />
            <StatsCard label="Verified Units" value={verified} color="gray" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
            <p className="text-gray-500 font-medium">Lead analytics coming soon</p>
            <p className="mt-1 text-sm text-gray-400">
              Lead scoring and conversion data will appear here once buyers engage via WhatsApp
            </p>
          </div>
        </>
      )}
    </div>
  );
}
