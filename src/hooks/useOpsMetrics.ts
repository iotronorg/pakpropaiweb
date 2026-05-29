"use client";

import { useQuery } from "@tanstack/react-query";
import { getOpsMetrics, getTraceStats } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { OpsMetrics, TraceStats } from "@/types";

export function useOpsMetrics() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const query = useQuery<OpsMetrics>({
    queryKey: ["ops-metrics"],
    queryFn: getOpsMetrics,
    enabled: isAdmin,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  return {
    metrics: isAdmin ? query.data : undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useTraceStats(route: string) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const query = useQuery<TraceStats>({
    queryKey: ["trace-stats", route],
    queryFn: () => getTraceStats(route),
    enabled: isAdmin && !!route,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  return {
    stats: isAdmin ? query.data : undefined,
    isLoading: query.isLoading,
  };
}
