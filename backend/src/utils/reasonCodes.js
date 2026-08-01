/**
 * Single source of truth for all match reason codes.
 * Import from here — never hardcode strings elsewhere.
 */
const REASON_CODES = {
  GRN_QTY_EXCEEDS_PO_QTY: 'grn_qty_exceeds_po_qty',
  INVOICE_QTY_EXCEEDS_GRN_QTY: 'invoice_qty_exceeds_grn_qty',
  INVOICE_QTY_EXCEEDS_PO_QTY: 'invoice_qty_exceeds_po_qty',
  INVOICE_DATE_AFTER_PO_DATE: 'invoice_date_after_po_date',
  DUPLICATE_PO: 'duplicate_po',
  DUPLICATE_DOCUMENT: 'duplicate_document',
  DUPLICATE_INVOICE_IGNORED: 'duplicate_invoice_ignored',
  ITEM_MISSING_IN_PO: 'item_missing_in_po',
  PRICE_MISMATCH: 'price_mismatch',
  MRP_MISMATCH: 'mrp_mismatch',
  UNMAPPED_MASTER_SKU: 'unmapped_master_sku',
};

const MATCH_STATUS = {
  INSUFFICIENT_DOCUMENTS: 'insufficient_documents',
  MISMATCH: 'mismatch',
  PARTIALLY_MATCHED: 'partially_matched',
  MATCHED: 'matched',
};

const HARD_VIOLATION_CODES = new Set([
  REASON_CODES.GRN_QTY_EXCEEDS_PO_QTY,
  REASON_CODES.INVOICE_QTY_EXCEEDS_GRN_QTY,
  REASON_CODES.INVOICE_QTY_EXCEEDS_PO_QTY,
  REASON_CODES.INVOICE_DATE_AFTER_PO_DATE,
  REASON_CODES.DUPLICATE_PO,
  REASON_CODES.DUPLICATE_DOCUMENT,
  REASON_CODES.ITEM_MISSING_IN_PO,
]);

const SOFT_WARNING_CODES = new Set([
  REASON_CODES.PRICE_MISMATCH,
  REASON_CODES.MRP_MISMATCH,
  REASON_CODES.UNMAPPED_MASTER_SKU,
]);

export { REASON_CODES, MATCH_STATUS, HARD_VIOLATION_CODES, SOFT_WARNING_CODES };
