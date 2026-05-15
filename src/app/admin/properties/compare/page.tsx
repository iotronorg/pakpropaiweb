"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { compareProperties, getProperties } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { Property } from "@/types";

const MAX_COMPARE = 4;

const ROWS: { label: string; key: keyof Property; format?: (v: unknown) => string }[] = [
  { label: "Ref No",         key: "ref_no" },
  { label: "City",           key: "city" },
  { label: "Location",       key: "location" },
  { label: "Type",           key: "property_type" },
  { label: "Area (Marla)",   key: "area_marla",  format: (v) => v != null ? String(v) : "—" },
  { label: "Price (PKR)",    key: "price_pkr",   format: (v) => v != null ? `₨ ${Number(v).toLocaleString()}` : "—" },
  { label: "Construction",   key: "construction_status" },
  { label: "Furnished",      key: "furnished_status" },
  { label: "Legal Status",   key: "legal_status" },
  { label: "AI Score",       key: "ai_score",    format: (v) => v != null ? `${v}/10` : "—" },
  { label: "Risk Level",     key: "risk_level" },
  { label: "Installments",   key: "installment_available", format: (v) => v ? "Yes" : "No" },
];

export default function PropertyComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["properties-for-compare", searchTerm],
    queryFn: () =>
      getProperties({ search: searchTerm || undefined, limit: 30 }).then((r) => r.data),
  });

  const { data: compareData, isLoading: comparing } = useQuery<Property[]>({
    queryKey: ["property-compare", selectedIds],
    queryFn: () => compareProperties(selectedIds).then((r) => r.data),
    enabled: selectedIds.length >= 2,
  });

  const allProperties: Property[] = listData?.results ?? [];

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_COMPARE
        ? [...prev, id]
        : prev
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Property Comparison</h1>
        <p className="text-sm text-gray-500 mt-1">Select up to {MAX_COMPARE} properties to compare side-by-side</p>
      </div>

      {/* Search + selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <input
          type="text"
          placeholder="Search properties…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {listLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto sm:grid-cols-2">
            {allProperties.map((p) => {
              const selected = selectedIds.includes(p.id);
              const disabled = !selected && selectedIds.length >= MAX_COMPARE;
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  disabled={disabled}
                  className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                    selected
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : disabled
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-xs font-mono text-gray-400">{p.ref_no}</p>
                  <p className="text-xs text-gray-500">{p.city} · {p.property_type}</p>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-400">{selectedIds.length}/{MAX_COMPARE} selected</p>
      </div>

      {/* Comparison table */}
      {selectedIds.length >= 2 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          {comparing ? (
            <div className="p-8 text-center"><LoadingSpinner /></div>
          ) : compareData && compareData.length >= 2 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-36">Field</th>
                  {compareData.map((p) => (
                    <th key={p.id} className="text-left px-4 py-3 font-semibold text-gray-900">
                      <span className="block truncate max-w-44">{p.title}</span>
                      <span className="block text-xs font-mono font-normal text-gray-400">{p.ref_no}</span>
                      <span className="text-xs font-normal text-gray-500">{p.city}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(({ label, key, format }) => (
                  <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">{label}</td>
                    {compareData.map((p) => {
                      const raw = p[key];
                      const display = format ? format(raw) : (raw ?? "—");
                      return (
                        <td key={p.id} className="px-4 py-2.5 text-gray-800">
                          {key === "legal_status" ? (
                            <Badge
                              label={String(raw ?? "—")}
                              variant={
                                raw === "verified" ? "green"
                                : raw === "disputed" ? "red"
                                : raw === "pending" ? "yellow"
                                : "gray"
                              }
                            />
                          ) : key === "risk_level" ? (
                            <Badge
                              label={String(raw ?? "—")}
                              variant={
                                raw === "low" ? "green"
                                : raw === "high" ? "red"
                                : raw === "medium" ? "yellow"
                                : "gray"
                              }
                            />
                          ) : (
                            String(display)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {selectedIds.length < 2 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-400 text-sm">Select at least 2 properties above to compare</p>
        </div>
      )}
    </div>
  );
}
