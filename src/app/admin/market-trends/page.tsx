"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMarketTrends } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MarketTrend } from "@/types";

// Cities are loaded from org's market data — this default list covers initial PK launch market
const CITIES = ["Karachi", "Lahore", "Islamabad", "Dubai", "Abu Dhabi", "London", "New York", "Rawalpindi"];

function formatPrice(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString();
}

function TrendBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-muted)] w-20 text-right truncate">{label}</span>
      <div className="flex-1 bg-[var(--bg-subtle)] rounded-full h-2 overflow-hidden">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[var(--text-muted)] w-16 text-right">{value}</span>
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
  const maxPrice    = Math.max(...trends.map((t) => t.avg_price ?? 0), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Market Trends</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Average listing prices and volume over time</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <label className="sr-only" htmlFor="market-city-filter">Filter by city</label>
          <select
            id="market-city-filter"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-[var(--border-strong)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div role="group" aria-label="Period" className="flex rounded-md border border-[var(--border-strong)] overflow-hidden text-sm">
          {(["monthly", "weekly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                period === p ? "bg-blue-600 text-white" : "text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
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
        <div className="rounded-xl border border-dashed border-[var(--border-strong)] py-12 text-center">
          <p className="text-[var(--text-muted)] text-sm">No trend data available for the selected filters</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Avg Price chart */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Average Price</h3>
            <div className="space-y-2">
              {trends.map((t) => (
                <div key={t.period} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] w-20 text-right truncate">{t.period}</span>
                  <div className="flex-1 bg-[var(--bg-subtle)] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${maxPrice > 0 ? Math.round(((t.avg_price ?? 0) / maxPrice) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] w-24 text-right">{formatPrice(t.avg_price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Listing volume chart */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Listing Volume</h3>
            <div className="space-y-2">
              {trends.map((t) => (
                <TrendBar key={t.period} label={t.period} value={t.listing_count} max={maxListings} />
              ))}
            </div>
          </div>

          {/* Data table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg overflow-hidden lg:col-span-2">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="text-start px-4 py-3 font-semibold text-[var(--text-muted)]">Period</th>
                  <th className="text-right px-4 py-3 font-semibold text-[var(--text-muted)]">Avg Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-[var(--text-muted)]">Listings</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t) => (
                  <tr key={t.period} className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)]">
                    <td className="px-4 py-2.5 text-[var(--text-primary)]">{t.period}</td>
                    <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">{formatPrice(t.avg_price)}</td>
                    <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">{t.listing_count}</td>
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
