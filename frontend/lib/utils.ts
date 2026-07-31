export const REASON_LABELS: Record<string, string> = {
  price_mismatch: 'Price Mismatch',
  mrp_mismatch: 'MRP Rate Mismatch',
  duplicate_po: 'Duplicate PO',
  duplicate_document: 'Duplicate Document',
  grn_qty_exceeds_po_qty: 'GRN Quantity Exceeds PO',
  invoice_qty_exceeds_grn_qty: 'Invoice Quantity Exceeds GRN',
  invoice_qty_exceeds_po_qty: 'Invoice Quantity Exceeds PO',
  invoice_date_after_po_date: 'Invoice Date Before PO Date',
  item_missing_in_po: 'Item Missing in PO',
  unmapped_master_sku: 'Unmapped SKU(s)',
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Summary table dates use DD-MM-YYYY per design reference. */
export function formatTableDate(value?: string | null): string {
  return formatDate(value).replace(/\//g, '-');
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function matchStatusLabel(status: string): string {
  switch (status) {
    case 'matched':
      return 'Matched';
    case 'partially_matched':
      return 'Partially Matched';
    case 'mismatch':
      return 'Mismatch';
    case 'insufficient_documents':
      return 'Insufficient Documents';
    default:
      return status;
  }
}

/** Sub-tab suffix shown after document number (e.g. "GRN: 5107297866 Raised"). */
export function documentSubTabStatus(
  docNumber: string,
  reasons: Array<{ code: string; message: string }>
): string {
  const isDuplicate = reasons.some(
    (reason) =>
      reason.code === 'duplicate_document' && reason.message.includes(docNumber)
  );

  if (isDuplicate) {
    return 'Duplicate';
  }

  return 'Raised';
}
