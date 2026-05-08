"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProperties, requestVerification, getDealLocks } from "@/lib/api";
import { DealLock } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import { Property } from "@/types";

const LEGAL_COLOR: Record<string, "green" | "yellow" | "red" | "gray"> = {
  verified:   "green",
  pending:    "yellow",
  unverified: "gray",
  disputed:   "red",
};

const FILTERS = ["all", "verified", "pending", "unverified", "disputed"] as const;
type Filter = typeof FILTERS[number];

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-300">Not scored</span>;
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{score}/100</span>
    </div>
  );
}

export default function AgentListingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["agent-listings"],
    queryFn: () => getMyProperties().then((r) => r.data),
  });

  const { data: dealsData } = useQuery({
    queryKey: ["active-deals"],
    queryFn: () => getDealLocks({ status: "locked" }).then((r) => r.data as DealLock[]),
  });
  const lockedPropertyIds = new Set<string>((dealsData ?? []).map((d) => d.property));

  const verifyMutation = useMutation({
    mutationFn: (id: string) => requestVerification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-listings"] }),
  });

  const allProperties: Property[] = data?.results ?? [];
  const properties = filter === "all"
    ? allProperties
    : allProperties.filter((p) => p.legal_status === filter);

  const counts = {
    all:        allProperties.length,
    verified:   allProperties.filter((p) => p.legal_status === "verified").length,
    pending:    allProperties.filter((p) => p.legal_status === "pending").length,
    unverified: allProperties.filter((p) => p.legal_status === "unverified").length,
    disputed:   allProperties.filter((p) => p.legal_status === "disputed").length,
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Properties you have listed via WhatsApp or manually
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 max-w-xs text-right">
          <p className="text-xs text-blue-700">
            List a property by WhatsApp — AI structures it automatically
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-1.5 ${filter === f ? "text-blue-200" : "text-gray-400"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : properties.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-gray-400">
            {filter === "all" ? "No listings yet" : `No ${filter} listings`}
          </p>
          {filter === "all" && (
            <p className="mt-1 text-xs text-gray-300">
              Send a WhatsApp message to list your first property
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <Badge label={p.property_type} />
                <div className="flex gap-1 items-center">
                  {lockedPropertyIds.has(p.id) && (
                    <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      🔒 Locked
                    </span>
                  )}
                  <Badge
                    label={p.legal_status}
                    variant={LEGAL_COLOR[p.legal_status] ?? "gray"}
                  />
                </div>
              </div>

              {/* Title + location */}
              <div>
                <h3 className="font-semibold text-gray-900 leading-snug">
                  {p.title || `Property #${p.id}`}
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">{p.location}, {p.city}</p>
              </div>

              {/* Price + area */}
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-bold text-blue-700">
                  {p.price_pkr ? formatPKR(p.price_pkr) : "Price TBD"}
                </p>
                {p.area_marla && (
                  <span className="text-sm text-gray-500">{p.area_marla} marla</span>
                )}
              </div>

              {/* AI score */}
              <ScoreBar score={p.ai_score} />

              {/* Secondary badges */}
              <div className="flex flex-wrap gap-1">
                {p.construction_status && (
                  <Badge
                    label={p.construction_status.replace("_", " ")}
                    variant={p.construction_status === "ready" ? "green" : "yellow"}
                  />
                )}
                {p.furnished_status && (
                  <Badge label={p.furnished_status.replace("_", " ")} />
                )}
                {p.risk_level && (
                  <Badge
                    label={`${p.risk_level} risk`}
                    variant={p.risk_level === "low" ? "green" : p.risk_level === "high" ? "red" : "yellow"}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>
                {p.legal_status === "unverified" && (
                  <button
                    onClick={() => verifyMutation.mutate(p.id)}
                    disabled={verifyMutation.isPending}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Request Verification
                  </button>
                )}
                {p.legal_status === "pending" && (
                  <span className="text-xs text-yellow-600 font-medium">Verification pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
