"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicPlatformStats } from "@/lib/api";
import type { PublicPlatformStats } from "@/lib/api";

export function usePublicStats() {
  const query = useQuery<PublicPlatformStats>({
    queryKey: ["public-platform-stats"],
    queryFn: getPublicPlatformStats,
    staleTime: 55_000,   // slightly under 60s server cache
    refetchInterval: 60_000,
    retry: 1,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
