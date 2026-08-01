import {
  REASON_CODES,
  MATCH_STATUS,
  HARD_VIOLATION_CODES,
  SOFT_WARNING_CODES,
} from '../utils/reasonCodes.js';
import { formatDateLabel, formatItemReasonMessage } from '../utils/reasonMessages.js';
import { normalizeCode } from './masterResolver.service.js';

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function computeMatch({ purchaseOrders = [], grns = [], invoices = [], skuMasters = [] }) {
  if (
    purchaseOrders.length === 0 &&
    grns.length === 0 &&
    invoices.length === 0
  ) {
    return {
      status: MATCH_STATUS.INSUFFICIENT_DOCUMENTS,
      reasons: [],
      items: [],
    };
  }

  const referencePo = purchaseOrders.length > 0 ? pickReferencePo(purchaseOrders) : null;
  const skuMap = buildSkuMap(skuMasters);
  const itemMap = buildItemMap({ referencePo, grns, invoices, skuMap });
  const items = buildItemRows(itemMap, skuMap);

  if (!hasAllDocumentTypes(purchaseOrders, grns, invoices)) {
    return {
      status: MATCH_STATUS.INSUFFICIENT_DOCUMENTS,
      reasons: [],
      items,
    };
  }

  const reasons = collectReasonCodes({
    referencePo,
    purchaseOrders,
    grns,
    invoices,
    items,
    skuMap,
  });
  const status = rollUpStatus(reasons, items);

  return { status, reasons, items };
}

function hasAllDocumentTypes(purchaseOrders, grns, invoices) {
  return purchaseOrders.length > 0 && grns.length > 0 && invoices.length > 0;
}

function pickReferencePo(purchaseOrders) {
  return [...purchaseOrders].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )[0];
}

function buildSkuMap(skuMasters) {
  return new Map(skuMasters.map((sku) => [String(sku._id), sku]));
}

function getMatchKey(item) {
  if (item.skuMaster) {
    return `sku:${String(item.skuMaster)}`;
  }

  return `raw:${normalizeCode(item.itemCode)}`;
}

function ensureItemEntry(itemMap, matchKey, seed = {}) {
  if (!itemMap.has(matchKey)) {
    itemMap.set(matchKey, {
      matchKey,
      skuMasterId: seed.skuMasterId || null,
      description: seed.description || '',
      poQty: 0,
      grnQty: 0,
      invoiceQty: 0,
      unitRate: null,
      mrp: null,
      sources: { po: false, grn: false, invoice: false },
      invoiceLines: [],
      grnMrps: [],
    });
  }

  return itemMap.get(matchKey);
}

function addPoItems(itemMap, purchaseOrder) {
  for (const item of purchaseOrder.items || []) {
    const matchKey = getMatchKey(item);
    const entry = ensureItemEntry(itemMap, matchKey, {
      skuMasterId: item.skuMaster ? String(item.skuMaster) : null,
      description: item.description,
    });

    entry.poQty += Number(item.quantity) || 0;
    entry.sources.po = true;

    if (item.skuMaster) {
      entry.skuMasterId = String(item.skuMaster);
    }
  }
}

function addGrnItems(itemMap, grn) {
  for (const item of grn.items || []) {
    const matchKey = getMatchKey(item);
    const entry = ensureItemEntry(itemMap, matchKey, {
      skuMasterId: item.skuMaster ? String(item.skuMaster) : null,
      description: item.description,
    });

    entry.grnQty += Number(item.receivedQuantity) || 0;
    entry.sources.grn = true;

    if (item.mrp != null) {
      entry.grnMrps.push(Number(item.mrp));
      entry.mrp = Number(item.mrp);
    }

    if (item.skuMaster) {
      entry.skuMasterId = String(item.skuMaster);
    }
  }
}

function addInvoiceItems(itemMap, invoice) {
  for (const item of invoice.items || []) {
    const matchKey = getMatchKey(item);
    const entry = ensureItemEntry(itemMap, matchKey, {
      skuMasterId: item.skuMaster ? String(item.skuMaster) : null,
      description: item.description,
    });

    entry.invoiceQty += Number(item.quantity) || 0;
    entry.sources.invoice = true;
    entry.invoiceLines.push({
      unitRate: item.unitRate != null ? Number(item.unitRate) : null,
      mrp: item.mrp != null ? Number(item.mrp) : null,
    });

    if (item.unitRate != null) {
      entry.unitRate = Number(item.unitRate);
    }

    if (item.mrp != null) {
      entry.mrp = Number(item.mrp);
    }

    if (item.skuMaster) {
      entry.skuMasterId = String(item.skuMaster);
    }
  }
}

function buildItemMap({ referencePo, grns, invoices }) {
  const itemMap = new Map();

  if (referencePo) {
    addPoItems(itemMap, referencePo);
  }

  for (const grn of grns) {
    addGrnItems(itemMap, grn);
  }

  for (const invoice of invoices) {
    addInvoiceItems(itemMap, invoice);
  }

  return itemMap;
}

function isPriceMismatch(unitRate, sku) {
  if (unitRate == null || sku?.agreedRate == null || sku.agreedRate <= 0) {
    return false;
  }

  const tolerance = sku.priceTolerance != null ? sku.priceTolerance : 0.05;
  const diff = Math.abs(unitRate - sku.agreedRate) / sku.agreedRate;

  return diff > tolerance;
}

function isMrpMismatch(mrp, sku) {
  if (mrp == null || sku?.mrp == null || sku.mrp <= 0) {
    return false;
  }

  const diff = Math.abs(mrp - sku.mrp) / sku.mrp;

  return diff > 0.01;
}

function buildItemReasons(entry, sku) {
  const reasons = [];
  const highlightedFields = [];

  if (!entry.skuMasterId) {
    reasons.push(REASON_CODES.UNMAPPED_MASTER_SKU);
  }

  if (!entry.sources.po && (entry.sources.grn || entry.sources.invoice)) {
    reasons.push(REASON_CODES.ITEM_MISSING_IN_PO);
  }

  if (entry.grnQty > entry.poQty) {
    reasons.push(REASON_CODES.GRN_QTY_EXCEEDS_PO_QTY);
    highlightedFields.push('poQty', 'grnQty');
  }

  if (entry.invoiceQty > entry.grnQty) {
    reasons.push(REASON_CODES.INVOICE_QTY_EXCEEDS_GRN_QTY);
    highlightedFields.push('grnQty', 'invoiceQty');
  }

  if (entry.invoiceQty > entry.poQty) {
    reasons.push(REASON_CODES.INVOICE_QTY_EXCEEDS_PO_QTY);
    highlightedFields.push('poQty', 'invoiceQty');
  }

  if (sku && entry.invoiceLines.length > 0) {
    const offendingLine = entry.invoiceLines.find(
      (line) => line.unitRate != null && isPriceMismatch(line.unitRate, sku)
    );

    if (offendingLine) {
      reasons.push(REASON_CODES.PRICE_MISMATCH);
      highlightedFields.push('unitPrice');
    }
  }

  const mrpToCheck = entry.mrp ?? entry.grnMrps[0] ?? null;

  if (sku && mrpToCheck != null && isMrpMismatch(mrpToCheck, sku)) {
    reasons.push(REASON_CODES.MRP_MISMATCH);
    highlightedFields.push('unitMrp');
  }

  const isFullyReconciled =
    entry.sources.po &&
    entry.poQty === entry.grnQty &&
    entry.grnQty === entry.invoiceQty;

  return {
    reasons,
    highlightedFields: [...new Set(highlightedFields)],
    isFullyReconciled,
  };
}

function buildItemRows(itemMap, skuMap) {
  return [...itemMap.values()].map((entry) => {
    const sku = entry.skuMasterId ? skuMap.get(entry.skuMasterId) : null;
    const { reasons, highlightedFields, isFullyReconciled } = buildItemReasons(entry, sku);
    const grossAmount =
      entry.unitRate != null && entry.invoiceQty > 0
        ? entry.unitRate * entry.invoiceQty
        : sku?.agreedRate != null && entry.invoiceQty > 0
          ? sku.agreedRate * entry.invoiceQty
          : null;

    return {
      matchKey: entry.matchKey,
      description: entry.description,
      itemCode: sku?.skuErpCode || entry.matchKey.replace(/^raw:/, ''),
      skuMaster: sku
        ? {
            _id: String(sku._id),
            skuErpCode: sku.skuErpCode,
            name: sku.name,
            eanCode: sku.eanCode,
            hsnCode: sku.hsnCode,
            uom: sku.uom,
            agreedRate: sku.agreedRate,
            mrp: sku.mrp,
            priceTolerance: sku.priceTolerance,
          }
        : null,
      poQty: entry.poQty,
      grnQty: entry.grnQty,
      invoiceQty: entry.invoiceQty,
      unitRate: entry.unitRate,
      mrp: entry.mrp,
      grossAmount,
      reasons,
      highlightedFields,
      isFullyReconciled,
    };
  });
}

function addReason(reasons, code, message, level) {
  if (reasons.some((reason) => reason.code === code && reason.message === message)) {
    return;
  }

  reasons.push({ code, message, level });
}

function collectDocumentLevelReasons({ purchaseOrders, grns, invoices, referencePo }) {
  const reasons = [];
  const poDate = referencePo?.poDate ? new Date(referencePo.poDate) : null;

  if (purchaseOrders.length > 1) {
    addReason(
      reasons,
      REASON_CODES.DUPLICATE_PO,
      `Multiple PO documents uploaded for ${referencePo.poNumber}; earliest PO is used for matching`,
      'hard'
    );
  }

  const grnNumbers = grns.map((grn) => grn.grnNumber);
  const duplicateGrns = grnNumbers.filter(
    (number, index) => grnNumbers.indexOf(number) !== index
  );

  if (duplicateGrns.length > 0) {
    addReason(
      reasons,
      REASON_CODES.DUPLICATE_DOCUMENT,
      `Duplicate GRN number(s): ${[...new Set(duplicateGrns)].join(', ')}`,
      'hard'
    );
  }

  const invoiceNumbers = invoices.map((invoice) => invoice.invoiceNumber);
  const duplicateInvoices = invoiceNumbers.filter(
    (number, index) => invoiceNumbers.indexOf(number) !== index
  );

  if (duplicateInvoices.length > 0) {
    addReason(
      reasons,
      REASON_CODES.DUPLICATE_DOCUMENT,
      `Duplicate Invoice number(s): ${[...new Set(duplicateInvoices)].join(', ')}`,
      'hard'
    );
  }

  if (poDate) {
    const poDay = startOfDay(poDate);

    for (const invoice of invoices) {
      const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;

      if (invoiceDate && startOfDay(invoiceDate) > poDay) {
        addReason(
          reasons,
          REASON_CODES.INVOICE_DATE_AFTER_PO_DATE,
          `Invoice ${invoice.invoiceNumber} dated ${formatDateLabel(invoice.invoiceDate)} is after PO date ${formatDateLabel(referencePo.poDate)}`,
          'hard'
        );
      }
    }
  }

  return reasons;
}

function collectItemReasons(items) {
  const reasons = [];

  for (const item of items) {
    for (const code of item.reasons) {
      const level = HARD_VIOLATION_CODES.has(code) ? 'hard' : 'soft';
      const message = formatItemReasonMessage(code, item);
      addReason(reasons, code, message, level);
    }
  }

  return reasons;
}

function collectReasonCodes(ctx) {
  const documentReasons = collectDocumentLevelReasons(ctx);
  const itemReasons = collectItemReasons(ctx.items);

  return [...documentReasons, ...itemReasons];
}

function rollUpStatus(reasons, items) {
  const codes = reasons.map((reason) => reason.code);

  if (codes.some((code) => HARD_VIOLATION_CODES.has(code))) {
    return MATCH_STATUS.MISMATCH;
  }

  const hasSoftWarnings = codes.some((code) => SOFT_WARNING_CODES.has(code));
  const allReconciled = items.length > 0 && items.every((item) => item.isFullyReconciled);

  if (hasSoftWarnings || !allReconciled) {
    return MATCH_STATUS.PARTIALLY_MATCHED;
  }

  if (codes.length === 0 && allReconciled) {
    return MATCH_STATUS.MATCHED;
  }

  return MATCH_STATUS.PARTIALLY_MATCHED;
}

export {
  computeMatch,
  REASON_CODES,
  getMatchKey,
  startOfDay,
};
