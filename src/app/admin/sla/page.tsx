"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSlaStatus } from "@/hooks/useSlaStatus";
import { resetCircuit } from "@/lib/api";
import type { CircuitState } from "@/types";

const stagger = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: "spring" as const, stiffness: 260, damping: 20 },
  }),
};

const SERVICES = ["meta_cloud_api", "whisper_stt", "llm_provider"] as const;
const SERVICE_LABELS: Record<string, string> = {
  meta_cloud_api: "Meta Cloud API",
  whisper_stt:    "Whisper STT",
  llm_provider:   "LLM Provider",
};

function stateBadge(state: CircuitState) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";
  switch (state) {
    case "CLOSED":    return `${base} bg-green-100 text-green-700`;
    case "OPEN":      return `${base} bg-red-100 text-red-700`;
    case "HALF_OPEN": return `${base} bg-amber-100 text-amber-700`;
    default:          return `${base} bg-gray-100 text-gray-600`;
  }
}

function CircuitCard({
  service,
  state,
  outage,
  index,
}: {
  service: string;
  state: CircuitState;
  outage: { is_open: boolean; error_rate: number; updated_at: string } | undefined;
  index: number;
}) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetCircuit(service);
    } finally {
      setResetting(false);
    }
  };

  return (
    <motion.div
      custom={index}
      variants={stagger}
      initial="hidden"
      animate="show"
      className="rounded-xl border border-gray-200 bg-white p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-sm">{SERVICE_LABELS[service] ?? service}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18 }}
            className={stateBadge(state)}
          >
            {state}
          </motion.span>
        </AnimatePresence>
      </div>

      {outage && (
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Error rate</span>
            <span className="font-mono text-gray-700">{(outage.error_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${outage.error_rate >= 0.15 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(100, outage.error_rate * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleReset}
        disabled={resetting || state === "CLOSED"}
        className="w-full rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      >
        {resetting ? "Resetting…" : "Force Reset"}
      </button>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-100" />
      <div className="h-2 w-full rounded-full bg-gray-100" />
    </div>
  );
}

export default function SlaPage() {
  const { status, isLoading } = useSlaStatus();
  const anyOpen = status
    ? Object.values(status.circuits).some((s) => s === "OPEN")
    : false;

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">SLA Monitor</h1>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <span
            className={`h-2 w-2 rounded-full animate-pulse ${anyOpen ? "bg-red-500" : "bg-green-500"}`}
          />
          {isLoading ? "Loading…" : anyOpen ? "Incident Active" : "All Systems Operational"}
        </span>
      </div>

      {/* Section 1 — Circuit Breaker States */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Circuit Breaker States</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoading
            ? SERVICES.map((s) => <SkeletonCard key={s} />)
            : SERVICES.map((service, i) => (
                <CircuitCard
                  key={service}
                  service={service}
                  state={(status?.circuits[service] as CircuitState) ?? "CLOSED"}
                  outage={status?.outages[service]}
                  index={i}
                />
              ))}
        </div>
      </section>

      {/* Section 2 — Component Uptime KPIs */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Component Uptime</h2>
        <div className="grid grid-cols-3 gap-4">
          {SERVICES.map((service, i) => {
            const isOpen = status?.outages[service]?.is_open ?? false;
            const pct = isOpen ? 95 : 100;
            const color = pct >= 99 ? "text-green-600" : pct >= 95 ? "text-amber-600" : "text-red-600";
            return (
              <motion.div
                key={service}
                custom={i}
                variants={stagger}
                initial="hidden"
                animate="show"
                className="rounded-xl border border-gray-200 bg-white p-4 text-center"
              >
                <p className={`text-2xl font-bold ${color}`}>{pct}%</p>
                <p className="mt-1 text-xs text-gray-500">{SERVICE_LABELS[service]}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Section 3 — Tenant Queue Isolation */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tenant Queue Isolation</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {isLoading ? (
            <div className="h-10 rounded bg-gray-100 animate-pulse" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-700">Isolated Organizations</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    (status?.queue_isolation.isolated_orgs.length ?? 0) > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {status?.queue_isolation.isolated_orgs.length ?? 0} isolated
                </span>
              </div>
              {(status?.queue_isolation.isolated_orgs ?? []).length === 0 ? (
                <p className="text-xs text-gray-400">No tenants currently isolated.</p>
              ) : (
                <div className="space-y-1">
                  {status!.queue_isolation.isolated_orgs.map((id) => (
                    <div key={id} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="font-mono text-gray-600">{id}</span>
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">Isolated</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Section 4 — Latency Distribution (deferred to OTel) */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Latency Distribution</h2>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
          Full latency data available after OTel setup — see Platform Operations panel.
        </div>
      </section>
    </div>
  );
}
