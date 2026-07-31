'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { SkuMaster, SkuMasterInput, StoredDocument } from '@/types/api';

export function usePoNumbers() {
  return useQuery({
    queryKey: queryKeys.poNumbers,
    queryFn: () => apiRequest<string[]>('/documents/po-numbers'),
  });
}

export function useDocuments(poNumber?: string) {
  const query = poNumber ? `?poNumber=${encodeURIComponent(poNumber)}` : '';

  return useQuery({
    queryKey: queryKeys.documents(poNumber),
    queryFn: () => apiRequest<StoredDocument[]>(`/documents${query}`),
  });
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: queryKeys.document(id ?? ''),
    queryFn: () => apiRequest<StoredDocument>(`/documents/${id}`),
    enabled: Boolean(id),
  });
}

export function useSkuMasters() {
  return useQuery({
    queryKey: queryKeys.skuMaster,
    queryFn: () => apiRequest<SkuMaster[]>('/masters/sku'),
    staleTime: 60_000,
  });
}

export function useSkuMaster(id: string) {
  return useQuery({
    queryKey: queryKeys.skuMasterItem(id),
    queryFn: () => apiRequest<SkuMaster>(`/masters/sku/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSku() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SkuMasterInput) =>
      apiRequest<SkuMaster>('/masters/sku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skuMaster });
    },
  });
}

export function useUpdateSku(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<SkuMasterInput>) =>
      apiRequest<SkuMaster>(`/masters/sku/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skuMaster });
      queryClient.invalidateQueries({ queryKey: queryKeys.skuMasterItem(id) });
    },
  });
}

export function useDeleteSku() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/masters/sku/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skuMaster });
    },
  });
}
