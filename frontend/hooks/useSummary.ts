'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { SummaryResponse } from '@/types/api';

export function useSummary(poNumber: string) {
  return useQuery({
    queryKey: queryKeys.summary(poNumber),
    queryFn: () => apiRequest<SummaryResponse>(`/summary/${encodeURIComponent(poNumber)}`),
    enabled: Boolean(poNumber),
    retry: false,
  });
}
