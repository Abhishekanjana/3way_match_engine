'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, apiUploadDocument } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { LoginResponse, MatchResponse, UploadProgressUpdate } from '@/types/api';

export function useMatch(poNumber: string) {
  return useQuery({
    queryKey: queryKeys.match(poNumber),
    queryFn: () => apiRequest<MatchResponse>(`/match/${encodeURIComponent(poNumber)}`),
    enabled: Boolean(poNumber),
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: () =>
      apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' }),
      }),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      documentType,
      onProgress,
    }: {
      file: File;
      documentType: string;
      onProgress?: (update: UploadProgressUpdate) => void;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      return apiUploadDocument(formData, onProgress);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.match(data.poNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary(data.poNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matchAudit(data.poNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(data.poNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.poNumbers });
    },
  });
}
