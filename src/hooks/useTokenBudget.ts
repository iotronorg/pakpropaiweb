"use client";

import { useQuery } from "@tanstack/react-query";
import { getTokenBudget, getTokenUsageStats, type TokenUsageParams } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { TokenBudgetStatus, TokenUsageStats } from "@/types";

export function useTokenBudget(orgId?: string) {
  const user = useAuthStore((s) => s.user);
  const canAccess = user?.role === "admin" || user?.role === "developer";

  const query = useQuery<TokenBudgetStatus>({
    queryKey: ["token-budget", orgId],
    queryFn: () => getTokenBudget(orgId),
    enabled: canAccess,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  return { budget: canAccess ? query.data : undefined, isLoading: query.isLoading };
}

export function useTokenUsageStats(params?: TokenUsageParams) {
  const user = useAuthStore((s) => s.user);
  const canAccess = user?.role === "admin" || user?.role === "developer";

  const query = useQuery<TokenUsageStats>({
    queryKey: ["token-usage-stats", params],
    queryFn: () => getTokenUsageStats(params),
    enabled: canAccess,
    staleTime: 30_000,
  });

  return { stats: canAccess ? query.data : undefined, isLoading: query.isLoading };
}
