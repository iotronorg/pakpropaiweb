"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMarketTrends } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MarketTrend } from "@/types";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Peshawar", "Quetta", "Multan"];

function formatPkr(value: number | null) {
  if (value == null) return "—";
  if (value >= 10_000_000) return `₨ ${(value / 10_000_000).toFixed(1)} Cr`;
  if (value >= 100_000) return `₨ ${(value / 100_000).toFixed(1)} L`;
  return `₨ ${value.toLocaleString()}`;
}

function TrendBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 text-right truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-700 w-16 text-right">{value}</span>
    </div>
  );
}

export default function MarketTrendsPage() {
  const [city, setCity]     = useState<string>("");
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");

  const { data, isLoading } = useQuery<MarketTrend[]>({
    queryKey: ["market-trends", city, period],
    queryFn: () =>
      getMarketTrends({ city: city || undefined, period }).then((r) => r.data),
  });

  const trends = data ?? [];
  const maxListings = Math.max(...trends.map((t) => t.listing_count), 1);
  const maxPrice    = Math.max(...trends.map((t) => t.avg_price_pkr ?? 0), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Market Trends</h1>
        <p className="text-sm text-gray-500 mt-1">Average listing prices and volume over time</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
          {(["monthly", "weekly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                period === p ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : trends.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-400 text-sm">No trend data available for the selected filters</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Avg Price chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Average Price (PKR)</h3>
            <div className="space-y-2">
              {trends.map((t) => (
                <div key={t.period} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 text-right truncate">{t.period}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${maxPrice > 0 ? Math.round(((t.avg_price_pkr ?? 0) / maxPrice) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-700 w-24 text-right">{formatPkr(t.avg_price_pkr)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Listing volume chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Listing Volume</h3>
            <div className="space-y-2">
              {trends.map((t) => (
                <TrendBar key={t.period} label={t.period} value={t.listing_count} max={maxListings} />
              ))}
            </div>
          </div>

          {/* Data table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden lg:col-span-2">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Period</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Avg Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Listings</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t) => (
                  <tr key={t.period} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800">{t.period}</td>
                    <td className="px-4 py-2.5 text-right text-gray-800">{formatPkr(t.avg_price_pkr)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-800">{t.listing_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
