"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getPropertyReport, getMarketTrends } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  StatCard, ChartCard, BarChart, BreakdownBar, SectionHeader,
  type Period, type TrendPoint,
} from "@/components/ui/Charts";
import type { PropertyReportData } from "@/types";

interface MarketTrendRow {
  period: string;
  city: string;
  property_type: string;
  avg_price: number;
  count: number;
}

function formatPrice(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  return n.toLocaleString();
}

export default function PropertyAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [city,   setCity]   = useState("");

  const { data: report, isLoading: l1 } = useQuery({
    queryKey: ["prop-analytics-report", period],
    queryFn: () => getPropertyReport({ period }).then((r) => r.data as PropertyReportData),
  });

  const { data: trendsRaw, isLoading: l2 } = useQuery({
    queryKey: ["prop-market-trends", city, period],
    queryFn: () => getMarketTrends({ city: city || undefined, period }).then((r) => r.data),
  });

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const r = report ?? {
    total: 0, avg_ai_score: 0, installment_available: 0,
    by_type: {}, by_legal_status: {}, by_risk_level: {}, by_city: {},
  };
  const trend: TrendPoint[] = report?.trend ?? [];
  const marketRows: MarketTrendRow[] = (trendsRaw as { results?: MarketTrendRow[] })?.results ?? [];

  // City price comparison: latest avg_price per city
  const cityPriceMap: Record<string, number> = {};
  for (const row of marketRows) {
    if (!cityPriceMap[row.city] || row.avg_price > 0) {
      cityPriceMap[row.city] = row.avg_price;
    }
  }
  const topCities = Object.entries(cityPriceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Avg price trend over time (all cities combined)
  const priceTrendMap: Record<string, { sum: number; cnt: number }> = {};
  for (const row of marketRows) {
    if (!priceTrendMap[row.period]) priceTrendMap[row.period] = { sum: 0, cnt: 0 };
    priceTrendMap[row.period].sum += row.avg_price;
    priceTrendMap[row.period].cnt += 1;
  }
  const avgPriceTrend = Object.entries(priceTrendMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, { sum, cnt }]) => ({
      period,
      count: cnt > 0 ? Math.round(sum / cnt) : 0,
    }));

  const uniqueCities = [...new Set(marketRows.map((r) => r.city))].filter(Boolean).sort();

  return (
    <div className="space-y-7 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/organization/inventory" className="text-sm text-gray-400 hover:text-gray-600">
          &larr; Inventory
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Property Analytics</h1>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Active"       value={r.total}                      accent="blue"    icon="🏠" />
        <StatCard label="Avg AI Score"       value={`${r.avg_ai_score}/100`}      accent="amber"   icon="🤖" />
        <StatCard label="Verified"           value={r.by_legal_status?.verified ?? 0} accent="emerald" icon="✅" />
        <StatCard label="Installment Plans"  value={r.installment_available}      accent="violet"  icon="📅" />
      </div>

      {/* Inventory growth trend */}
      {trend.length > 0 && (
        <ChartCard title="Inventory Growth" period={period} onPeriodChange={setPeriod}>
          <BarChart data={trend} period={period} color="blue" height={28} />
        </ChartCard>
      )}

      {/* Market price trend */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <SectionHeader title="Market Price Trends" sub="Average listing price over time" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Cities</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {avgPriceTrend.length > 0 ? (
          <ChartCard title={`Avg Price${city ? ` — ${city}` : ""}`} period={period} onPeriodChange={setPeriod}>
            <BarChart data={avgPriceTrend} period={period} color="emerald" height={28} />
          </ChartCard>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            No market price data available yet. Add listings to see price trends.
          </div>
        )}
      </div>

      {/* City price comparison */}
      {topCities.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Average Price by City</h3>
          <div className="space-y-3">
            {topCities.map(([cityName, avgPrice]) => {
              const maxPrice = topCities[0]?.[1] ?? 1;
              const pct = Math.round((avgPrice / maxPrice) * 100);
              return (
                <div key={cityName} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-600 font-medium truncate">{cityName}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-20 text-right tabular-nums">
                    {formatPrice(avgPrice)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribution row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">By Property Type</h3>
          {Object.keys(r.by_type).length > 0
            ? <BreakdownBar data={r.by_type} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Legal Status</h3>
          {Object.keys(r.by_legal_status).length > 0
            ? <BreakdownBar data={r.by_legal_status} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Level</h3>
          {Object.keys(r.by_risk_level).length > 0
            ? <BreakdownBar data={r.by_risk_level} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
      </div>

      {/* Top cities by volume */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Listings by City</h3>
        {Object.keys(r.by_city).length > 0
          ? <BreakdownBar data={r.by_city} />
          : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
      </div>
    </div>
  );
}
