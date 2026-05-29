'use client';

import { useQuery } from '@tanstack/react-query';
import { getProvisioningStatus } from '@/lib/api';
import type { OrgProvisioningRecord } from '@/types';

export function useProvisioningStatus() {
  const query = useQuery<OrgProvisioningRecord>({
    queryKey: ['provisioning-status'],
    queryFn: getProvisioningStatus,
    refetchInterval: (query) => {
      const mode = query.state.data?.operational_mode;
      return mode === 'provisioning' ? 3000 : false;
    },
    retry: false,
  });

  return {
    record: query.data,
    status: query.data?.operational_mode ?? null,
    isPolling: query.data?.operational_mode === 'provisioning',
    isLoading: query.isLoading,
    error: query.error,
  };
}
