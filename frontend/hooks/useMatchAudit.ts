'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { MatchAuditResponse } from '@/types/api';

export function useMatchAudit(poNumber: string) {
  return useQuery({
    queryKey: queryKeys.matchAudit(poNumber),
    queryFn: () =>
      apiRequest<MatchAuditResponse>(`/match/${encodeURIComponent(poNumber)}/audit`),
    enabled: Boolean(poNumber),
    retry: false,
  });
}
