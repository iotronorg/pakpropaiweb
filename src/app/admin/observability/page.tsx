"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOpsMetrics, useTraceStats } from "@/hooks/useOpsMetrics";

const ROUTES = [
  "whatsapp.webhook",
  "celery.process_whatsapp",
  "celery.sync_platform",
  "postgres.transaction_lock",
  "meta.outbound_payload",
];

const SLO_MS = 500;

const stagger = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: "spring" as const, stiffness: 260, damping: 20 },
  }),
};

function SectionTitle({ title, index }: { title: string; index: number }) {
  return (
    <motion.h2
      custom={index}
      variants={stagger}
      initial="hidden"
      animate="show"
      className="text-lg font-semibold text-gray-800"
    >
      {title}
    </motion.h2>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

function latencyColor(ms: number): string {
  if (ms < 200) return "bg-green-500";
  if (ms < 500) return "bg-amber-400";
  return "bg-red-500";
}

function latencyTextColor(ms: number): string {
  if (ms < 200) return "text-green-700";
  if (ms < 500) return "text-amber-700";
  return "text-red-700";
}

/** Vertical bar chart for error distribution */
function ErrorBarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-3 h-48 px-2 pt-4">
      {data.map((d) => {
        const heightPct = Math.max((d.count / max) * 80, d.count > 0 ? 4 : 0);
        return (
          <div key={d.label} className="flex flex-col items-center flex-1 h-full justify-end min-w-0">
            {d.count > 0 && (
              <span className="text-[11px] font-semibold text-gray-600 mb-0.5">{d.count}</span>
            )}
            <div
              className="w-full rounded-t bg-red-500 transition-all"
              style={{ height: `${heightPct}%` }}
              title={`${d.label}: ${d.count}`}
            />
            <span className="text-[10px] text-gray-400 mt-1.5 truncate w-full text-center leading-tight">
              {d.label.replace(".", "​.")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal bar chart for P99 latencies with SLO marker */
function LatencyBarChart({ data }: { data: { route: string; ms: number }[] }) {
  const maxMs = Math.max(...data.map((d) => d.ms), SLO_MS + 100);
  const sloPos = (SLO_MS / maxMs) * 100;

  return (
    <div className="space-y-3">
      {/* SLO reference header */}
      <div className="relative h-4">
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-400"
          style={{ left: `calc(${sloPos}% + 116px)` }}
        />
        <span
          className="absolute text-[10px] text-slate-500 font-medium"
          style={{ left: `calc(${sloPos}% + 120px)`, top: 0 }}
        >
          SLO 500ms
        </span>
      </div>

      {data.map((d) => {
        const widthPct = Math.max((d.ms / maxMs) * 100, 1);
        return (
          <div key={d.route} className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 w-28 shrink-0 truncate text-right leading-tight">
              {d.route}
            </span>
            <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-visible">
              {/* SLO line inside the bar track */}
              <div
                className="absolute top-0 bottom-0 w-px bg-slate-400 z-10"
                style={{ left: `${sloPos}%` }}
              />
              <div
                className={`h-full rounded-full ${latencyColor(d.ms)} transition-all`}
                style={{ width: `${widthPct}%` }}
                title={`${d.ms}ms`}
              />
            </div>
            <span className={`text-xs font-semibold w-14 shrink-0 ${latencyTextColor(d.ms)}`}>
              {d.ms}ms
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ObservabilityPage() {
  const { metrics, isLoading } = useOpsMetrics();
  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const { stats } = useTraceStats(selectedRoute);

  const errorData = Object.entries(metrics?.error_distribution ?? {}).map(([k, v]) => ({
    label: k,
    count: v,
  }));

  const latencyData = Object.entries(metrics?.p99_latencies ?? {}).map(([route, ms]) => ({
    route,
    ms,
  }));

  const conns = metrics?.active_connections ?? {
    websocket: 0,
    celery_workers: 0,
    redis: 0,
    postgres: 0,
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Platform Operations</h1>
        <AnimatePresence>
          {!isLoading && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Live
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Section 1 — Error Distribution */}
      <div className="space-y-3">
        <SectionTitle title="System Error Distribution (24h)" index={0} />
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : errorData.length === 0 ? (
          <motion.div
            custom={1}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex h-24 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-sm font-medium text-green-700"
          >
            No errors in the last 24 hours
          </motion.div>
        ) : (
          <motion.div
            custom={1}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <ErrorBarChart data={errorData} />
          </motion.div>
        )}
      </div>

      {/* Section 2 — DLQ */}
      <div className="space-y-3">
        <SectionTitle title="Dead-Letter Queue" index={2} />
        <motion.div custom={3} variants={stagger} initial="hidden" animate="show">
          {isLoading ? (
            <Skeleton className="h-20 w-48" />
          ) : (
            <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
              <span className="text-4xl font-bold text-gray-900">{metrics?.dlq_depth ?? 0}</span>
              {(metrics?.dlq_depth ?? 0) === 0 ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  No backlog
                </span>
              ) : (metrics?.dlq_depth ?? 0) > 50 ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  Critical
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  Backlog
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Section 3 — P99 Latencies */}
      <div className="space-y-3">
        <SectionTitle title="P99 Request Latencies" index={4} />
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <motion.div
            custom={5}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            {latencyData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No latency data yet</p>
            ) : (
              <LatencyBarChart data={latencyData} />
            )}
          </motion.div>
        )}
      </div>

      {/* Section 4 — Active Connections */}
      <div className="space-y-3">
        <SectionTitle title="Active Connections" index={6} />
        <motion.div
          custom={7}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {(
            [
              { label: "WebSocket", key: "websocket", icon: "🔌" },
              { label: "Celery Workers", key: "celery_workers", icon: "⚙️" },
              { label: "Redis Clients", key: "redis", icon: "🗄️" },
              { label: "Postgres Conns", key: "postgres", icon: "🐘" },
            ] as const
          ).map((item) => (
            <AnimatePresence key={item.key}>
              <motion.div
                key={`${item.key}-${conns[item.key]}`}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <span>{item.icon}</span>
                  {item.label}
                </div>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {isLoading ? "—" : conns[item.key]}
                </p>
              </motion.div>
            </AnimatePresence>
          ))}
        </motion.div>
      </div>

      {/* Section 5 — Route Trace Inspector */}
      <div className="space-y-3">
        <SectionTitle title="Route Trace Inspector" index={8} />
        <motion.div custom={9} variants={stagger} initial="hidden" animate="show" className="space-y-4">
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ROUTES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-4">
            {(["p50_ms", "p95_ms", "p99_ms"] as const).map((pct) => (
              <div key={pct} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {pct.replace("_ms", "").toUpperCase()}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stats ? `${stats[pct]}ms` : "—"}
                </p>
              </div>
            ))}
          </div>
          {stats && (
            <p className="text-xs text-gray-400">
              {stats.sample_count} samples in window
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
