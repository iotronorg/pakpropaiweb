"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProperties } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import { Property } from "@/types";

const TYPES = ["All", "apartment", "house", "plot", "commercial"];

export default function InventoryPage() {
  const [typeFilter, setTypeFilter] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["dev-inventory", typeFilter],
    queryFn: () =>
      getProperties(typeFilter !== "All" ? { property_type: typeFilter } : undefined).then(
        (r) => r.data
      ),
  });

  const properties: Property[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">All units in your portfolio</p>
        </div>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <Badge label={p.property_type} variant="blue" />
                <Badge
                  label={p.is_verified ? "Verified" : "Pending"}
                  variant={p.is_verified ? "green" : "yellow"}
                />
              </div>
              <h3 className="font-semibold text-gray-900">{p.title || `Unit #${p.id}`}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.location}, {p.city}</p>
              <p className="mt-2 text-xl font-bold text-blue-700">
                {p.price ? formatPKR(p.price) : "TBD"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1 text-xs text-gray-400">
                {p.size && <span>{p.size}</span>}
                {p.bedrooms && <span>· {p.bedrooms} bed</span>}
                {p.construction_status && (
                  <Badge
                    label={p.construction_status}
                    variant={p.construction_status === "ready" ? "green" : "yellow"}
                  />
                )}
              </div>
              <p className="mt-3 text-xs text-gray-400">Added {formatDate(p.created_at)}</p>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">No inventory found</div>
          )}
        </div>
      )}
    </div>
  );
}
