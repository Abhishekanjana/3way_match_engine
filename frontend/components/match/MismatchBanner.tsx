import { AlertTriangle } from 'lucide-react';
import { REASON_LABELS } from '@/lib/utils';
import type { MatchReason } from '@/types/api';

const PO_VIEW_CODES = new Set([
  'price_mismatch',
  'mrp_mismatch',
  'duplicate_po',
  'grn_qty_exceeds_po_qty',
  'invoice_qty_exceeds_po_qty',
  'unmapped_master_sku',
  'item_missing_in_po',
  'duplicate_document',
  'invoice_qty_exceeds_grn_qty',
  'invoice_date_after_po_date',
]);

export function MismatchBanner({ reasons }: { reasons: MatchReason[] }) {
  const visible = reasons.filter((reason) => PO_VIEW_CODES.has(reason.code));

  if (visible.length === 0) {
    return null;
  }

  const labels = Array.from(
    new Set(visible.map((reason) => REASON_LABELS[reason.code] ?? reason.message))
  );

  return (
    <div className="mx-4 mt-3 flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <ul className="list-disc space-y-1 pl-4">
        {labels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </div>
  );
}

export function InsufficientDocsBanner() {
  return (
    <div className="mx-4 mt-3 rounded-md border border-brand-border bg-brand-card px-4 py-3 text-sm text-brand-muted">
      Upload Purchase Order, at least one GRN (Delivery), and at least one Invoice (Fulfillment) to
      run a full three-way match.
    </div>
  );
}
