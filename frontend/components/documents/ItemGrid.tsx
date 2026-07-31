'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { HighlightedField, MatchItemRow } from '@/types/api';

type GridMode = 'po' | 'invoice' | 'grn';

type GridRow = {
  key: string;
  skuName: string;
  skuId: string;
  mappedName: string;
  erpCode: string;
  ean: string;
  hsn: string;
  uom: string;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  expectedQty?: number;
  receivedQty?: number;
  unitPrice: number | null;
  unitMrp: number | null;
  grossAmount: number | null;
  reasons: string[];
  highlightedFields: HighlightedField[];
  unmapped: boolean;
  missingInPo: boolean;
};

function isHighlighted(fields: HighlightedField[], field: HighlightedField) {
  return fields.includes(field);
}

function toGridRow(item: MatchItemRow): GridRow {
  return {
    key: item.matchKey,
    skuName: item.skuMaster?.name ?? item.description,
    skuId: item.skuMaster?._id ?? item.itemCode,
    mappedName: item.skuMaster?.name ?? 'Unmapped',
    erpCode: item.skuMaster?.skuErpCode ?? item.itemCode,
    ean: item.skuMaster?.eanCode ?? '—',
    hsn: item.skuMaster?.hsnCode ?? '—',
    uom: item.skuMaster?.uom ?? '—',
    poQty: item.poQty,
    grnQty: item.grnQty,
    invoiceQty: item.invoiceQty,
    expectedQty: item.poQty,
    receivedQty: item.grnQty,
    unitPrice: item.unitRate,
    unitMrp: item.mrp,
    grossAmount: item.grossAmount,
    reasons: item.reasons,
    highlightedFields: item.highlightedFields ?? [],
    unmapped: item.reasons.includes('unmapped_master_sku'),
    missingInPo: item.reasons.includes('item_missing_in_po'),
  };
}

export function ItemGrid({
  items,
  mode = 'po',
}: {
  items: MatchItemRow[];
  mode?: GridMode;
}) {
  const [filter, setFilter] = useState<'all' | 'exception' | 'unmapped'>('all');

  const rows = useMemo(() => items.map(toGridRow), [items]);
  const exceptionCount = rows.filter((row) => row.reasons.length > 0).length;
  const unmappedCount = rows.filter((row) => row.unmapped).length;

  const filtered = rows.filter((row) => {
    if (filter === 'exception') {
      return row.reasons.length > 0;
    }

    if (filter === 'unmapped') {
      return row.unmapped;
    }

    return true;
  });

  const filters = [
    { id: 'all' as const, label: `All (${rows.length})` },
    { id: 'exception' as const, label: `Exception (${exceptionCount})` },
    { id: 'unmapped' as const, label: `Unmapped (${unmappedCount})` },
  ];

  return (
    <div className="card-surface-white overflow-hidden">
      {mode === 'po' && (
        <div className="flex gap-4 border-b border-brand-border px-4 py-2">
          {filters.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'text-sm font-medium',
                filter === tab.id ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-brand-card text-brand-muted">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">SKU Name</th>
              <th className="px-3 py-2">SKU ID</th>
              <th className="px-3 py-2">Mapped SKU Name</th>
              <th className="px-3 py-2">ERP Code</th>
              <th className="px-3 py-2">EAN</th>
              <th className="px-3 py-2">HSN</th>
              <th className="px-3 py-2">UOM</th>
              {mode !== 'grn' && <th className="px-3 py-2">PO Qty</th>}
              {mode === 'grn' && <th className="px-3 py-2">Expected Qty</th>}
              {mode === 'grn' && <th className="px-3 py-2">Received Qty</th>}
              {mode === 'invoice' && <th className="px-3 py-2">Invoice Qty</th>}
              {mode === 'po' && <th className="px-3 py-2">GRN Qty</th>}
              {mode === 'po' && <th className="px-3 py-2">Invoice Qty</th>}
              {(mode === 'po' || mode === 'invoice') && <th className="px-3 py-2">Unit Price</th>}
              <th className="px-3 py-2">Unit MRP</th>
              <th className="px-3 py-2">Gross Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr
                key={row.key}
                className={cn(
                  'border-t border-brand-border',
                  row.missingInPo && 'border-l-4 border-l-amber-400'
                )}
              >
                <td className="px-3 py-2 text-brand-muted">{index + 1}</td>
                <td className="px-3 py-2">{row.skuName}</td>
                <td className="px-3 py-2">{row.skuId}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    {row.unmapped && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                    {row.mappedName}
                    {row.unmapped && (
                      <span className="rounded bg-brand-card px-1.5 py-0.5 text-[10px] text-brand-muted">
                        Unmapped
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2">{row.erpCode}</td>
                <td className="px-3 py-2">{row.ean}</td>
                <td className="px-3 py-2">{row.hsn}</td>
                <td className="px-3 py-2">{row.uom}</td>
                {mode !== 'grn' && (
                  <td
                    className={cn(
                      'px-3 py-2',
                      isHighlighted(row.highlightedFields, 'poQty') && 'bg-red-50 font-medium text-red-700'
                    )}
                  >
                    {row.poQty}
                  </td>
                )}
                {mode === 'grn' && (
                  <td
                    className={cn(
                      'px-3 py-2',
                      isHighlighted(row.highlightedFields, 'poQty') && 'bg-red-50 font-medium text-red-700'
                    )}
                  >
                    {row.expectedQty}
                  </td>
                )}
                {mode === 'grn' && (
                  <td
                    className={cn(
                      'px-3 py-2',
                      isHighlighted(row.highlightedFields, 'grnQty') && 'bg-red-50 font-medium text-red-700'
                    )}
                  >
                    {row.receivedQty}
                  </td>
                )}
                {mode === 'invoice' && (
                  <td
                    className={cn(
                      'px-3 py-2',
                      isHighlighted(row.highlightedFields, 'invoiceQty') &&
                        'bg-red-50 font-medium text-red-700'
                    )}
                  >
                    {row.invoiceQty}
                  </td>
                )}
                {mode === 'po' && (
                  <td
                    className={cn(
                      'px-3 py-2',
                      isHighlighted(row.highlightedFields, 'grnQty') && 'bg-red-50 font-medium text-red-700'
                    )}
                  >
                    {row.grnQty}
                  </td>
                )}
                {mode === 'po' && (
                  <td
                    className={cn(
                      'px-3 py-2',
                      isHighlighted(row.highlightedFields, 'invoiceQty') &&
                        'bg-red-50 font-medium text-red-700'
                    )}
                  >
                    {row.invoiceQty}
                  </td>
                )}
                {(mode === 'po' || mode === 'invoice') && (
                  <td
                    className={cn(
                      'px-3 py-2',
                      isHighlighted(row.highlightedFields, 'unitPrice') &&
                        'bg-red-50 font-medium text-red-700'
                    )}
                  >
                    {row.unitPrice ?? '—'}
                  </td>
                )}
                <td
                  className={cn(
                    'px-3 py-2',
                    isHighlighted(row.highlightedFields, 'unitMrp') && 'bg-red-50 font-medium text-red-700'
                  )}
                >
                  {row.unitMrp ?? '—'}
                </td>
                <td className="px-3 py-2">
                  {row.grossAmount != null ? formatCurrency(row.grossAmount) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-brand-muted">No items to display.</div>
      )}
    </div>
  );
}
