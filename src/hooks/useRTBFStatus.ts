"use client";

import { useQuery } from "@tanstack/react-query";
import { getRTBFStatus } from "@/lib/api";
import type { RTBFRequest } from "@/types";

const TERMINAL = new Set(["completed", "failed"]);

export function useRTBFStatus(requestId: string | null) {
  const query = useQuery<RTBFRequest>({
    queryKey: ["rtbf-status", requestId],
    queryFn: () => getRTBFStatus(requestId!),
    enabled: !!requestId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL.has(status)) return false;
      return 5000;
    },
  });

  return {
    status: query.data?.status ?? null,
    completedAt: query.data?.completed_at ?? null,
    erasureScope: query.data?.erasure_scope ?? null,
    isLoading: query.isLoading,
  };
}
