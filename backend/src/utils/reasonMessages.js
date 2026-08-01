import { REASON_CODES } from './reasonCodes.js';

function itemLabel(item) {
  return item.itemCode || item.matchKey?.replace(/^raw:/, '') || 'unknown item';
}

function formatItemReasonMessage(code, item) {
  const sku = itemLabel(item);
  const description = item.description ? ` (${item.description})` : '';

  switch (code) {
    case REASON_CODES.GRN_QTY_EXCEEDS_PO_QTY:
      return `GRN received ${item.grnQty} exceeds PO ordered ${item.poQty} for SKU ${sku}`;
    case REASON_CODES.INVOICE_QTY_EXCEEDS_GRN_QTY:
      return `Invoice qty ${item.invoiceQty} exceeds GRN received ${item.grnQty} for SKU ${sku}`;
    case REASON_CODES.INVOICE_QTY_EXCEEDS_PO_QTY:
      return `Invoice qty ${item.invoiceQty} exceeds PO ordered ${item.poQty} for SKU ${sku}`;
    case REASON_CODES.ITEM_MISSING_IN_PO:
      return `SKU ${sku}${description} appears on GRN/Invoice but not on the PO`;
    case REASON_CODES.UNMAPPED_MASTER_SKU:
      return `SKU ${sku}${description} is not linked to SKU Master`;
    case REASON_CODES.PRICE_MISMATCH: {
      const agreedRate = item.skuMaster?.agreedRate;
      const tolerance = item.skuMaster?.priceTolerance ?? 0.05;
      const rate = item.unitRate != null ? item.unitRate : '—';
      if (agreedRate != null) {
        return `Invoice rate ${rate} is outside ${(tolerance * 100).toFixed(0)}% tolerance vs agreed rate ${agreedRate} for SKU ${sku}`;
      }
      return `Invoice rate ${rate} does not match agreed rate for SKU ${sku}`;
    }
    case REASON_CODES.MRP_MISMATCH: {
      const masterMrp = item.skuMaster?.mrp;
      const mrp = item.mrp != null ? item.mrp : '—';
      if (masterMrp != null) {
        return `MRP ${mrp} differs from master MRP ${masterMrp} for SKU ${sku}`;
      }
      return `MRP ${mrp} does not match SKU Master for SKU ${sku}`;
    }
    default:
      return `${code} for SKU ${sku}`;
  }
}

function formatDateLabel(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString().slice(0, 10);
}

export { formatItemReasonMessage, formatDateLabel, itemLabel };
