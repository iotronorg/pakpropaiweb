"use client";

import { useQuery } from "@tanstack/react-query";
import { getSlaStatus } from "@/lib/api";
import type { SlaStatus } from "@/types";

export function useSlaStatus(): {
  status: SlaStatus | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sla-status"],
    queryFn: getSlaStatus,
    refetchInterval: 10_000,
    staleTime: 8_000,
  });

  return { status: data, isLoading, error: error as Error | null };
}
