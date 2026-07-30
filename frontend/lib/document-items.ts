import type { DocumentItem, MatchItemRow, SkuMaster } from '@/types/api';

type DocumentItemWithSku = DocumentItem & {
  skuMaster?: SkuMaster | string | null;
};

function normalizeSku(sku: DocumentItemWithSku['skuMaster']): SkuMaster | null {
  if (!sku || typeof sku === 'string') {
    return null;
  }

  return {
    ...sku,
    _id: String(sku._id),
  };
}

export function documentItemsToMatchRows(items: DocumentItemWithSku[] = []): MatchItemRow[] {
  return items.map((item) => {
    const skuMaster = normalizeSku(item.skuMaster);
    const unmapped = !skuMaster;

    return {
      matchKey: skuMaster?._id ? `sku:${skuMaster._id}` : `raw:${item.itemCode}`,
      description: item.description ?? '',
      itemCode: skuMaster?.skuErpCode ?? item.itemCode,
      skuMaster,
      poQty: Number(item.quantity) || 0,
      grnQty: Number(item.receivedQuantity) || 0,
      invoiceQty: Number(item.quantity) || 0,
      unitRate: item.unitRate ?? null,
      mrp: item.mrp ?? null,
      grossAmount: null,
      reasons: unmapped ? ['unmapped_master_sku'] : [],
      highlightedFields: [],
    };
  });
}

export function sumDocumentQuantity(
  items: DocumentItem[] = [],
  field: 'quantity' | 'receivedQuantity' = 'quantity'
) {
  return items.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}
