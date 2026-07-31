export const queryKeys = {
  match: (poNumber: string) => ['match', poNumber] as const,
  summary: (poNumber: string) => ['summary', poNumber] as const,
  matchAudit: (poNumber: string) => ['match-audit', poNumber] as const,
  poNumbers: ['po-numbers'] as const,
  documents: (poNumber?: string) => ['documents', poNumber ?? 'all'] as const,
  document: (id: string) => ['document', id] as const,
  skuMaster: ['sku-master'] as const,
  skuMasterItem: (id: string) => ['sku-master', id] as const,
};
