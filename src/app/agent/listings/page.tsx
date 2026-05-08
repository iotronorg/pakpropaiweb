"use client";

import { useQuery } from "@tanstack/react-query";
import { getProperties } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import { Property } from "@/types";

export default function AgentListingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-listings"],
    queryFn: () => getProperties().then((r) => r.data),
  });

  const properties: Property[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <p className="mt-1 text-sm text-gray-500">Properties you have listed via WhatsApp or manually</p>
      </div>

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-5 py-3">
        <p className="text-sm text-blue-700">
          List a new property by sending a WhatsApp message describing it — the AI will structure it automatically.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <Badge
                  label={p.is_verified ? "Verified" : "Unverified"}
                  variant={p.is_verified ? "green" : "yellow"}
                />
                {p.risk_score !== null && (
                  <span className="text-xs text-gray-400">Risk {p.risk_score}/10</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 leading-snug">
                {p.title || `Property #${p.id}`}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{p.location}, {p.city}</p>
              <p className="mt-2 text-lg font-bold text-blue-700">
                {p.price ? formatPKR(p.price) : "Price TBD"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge label={p.property_type} />
                <Badge label={p.listing_type} variant="blue" />
                {p.bedrooms && <Badge label={`${p.bedrooms} Bed`} />}
              </div>
              <p className="mt-3 text-xs text-gray-400">Listed {formatDate(p.created_at)}</p>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-3 rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
              <p className="text-gray-400">No listings yet</p>
              <p className="mt-1 text-xs text-gray-300">Send a WhatsApp message to list your first property</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
