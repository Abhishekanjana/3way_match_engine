import PurchaseOrder from '../models/PurchaseOrder.js';
import Grn from '../models/Grn.js';
import Invoice from '../models/Invoice.js';
import SkuMaster from '../models/SkuMaster.js';
import ApiError from '../utils/ApiError.js';
import { liveResolvePoBundle } from './documentResolve.service.js';

async function buildSkuRateMap(documents) {
  const skuIds = new Set();

  for (const doc of documents) {
    for (const item of doc.items || []) {
      if (item.skuMaster) {
        skuIds.add(String(item.skuMaster));
      }
    }
  }

  if (skuIds.size === 0) {
    return new Map();
  }

  const skus = await SkuMaster.find({ _id: { $in: [...skuIds] } }).lean();

  return new Map(skus.map((sku) => [String(sku._id), sku]));
}

function sumPoAmount(referencePo, skuRateMap) {
  return (referencePo.items || []).reduce((total, item) => {
    const sku = item.skuMaster ? skuRateMap.get(String(item.skuMaster)) : null;
    const rate = sku?.agreedRate ?? 0;

    return total + (Number(item.quantity) || 0) * rate;
  }, 0);
}

function sumInvoiceAmount(invoices) {
  return invoices.reduce((total, invoice) => {
    const invoiceTotal = (invoice.items || []).reduce((lineTotal, item) => {
      const rate = item.unitRate != null ? Number(item.unitRate) : 0;
      return lineTotal + (Number(item.quantity) || 0) * rate;
    }, 0);

    return total + invoiceTotal;
  }, 0);
}

function sumReceivedAmount(grns, skuRateMap) {
  return grns.reduce((total, grn) => {
    const grnTotal = (grn.items || []).reduce((lineTotal, item) => {
      const sku = item.skuMaster ? skuRateMap.get(String(item.skuMaster)) : null;
      const rate = sku?.agreedRate ?? 0;

      return lineTotal + (Number(item.receivedQuantity) || 0) * rate;
    }, 0);

    return total + grnTotal;
  }, 0);
}

function sumPoQuantity(referencePo) {
  return (referencePo.items || []).reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toISOString().slice(0, 10);
}

function buildSummaryRows(poNumber, referencePo, invoices, grns) {
  const rows = [];
  const poQty = referencePo ? sumPoQuantity(referencePo) : 0;

  if (referencePo) {
    rows.push({
      documentType: 'Original PO',
      documentNo: referencePo.poNumber,
      documentId: String(referencePo._id),
      date: formatDate(referencePo.poDate),
      quantity: poQty,
      cumulativeInvoice: 0,
      cumulativeGrn: 0,
      pendingDelivery: poQty,
    });
  } else {
    rows.push({
      documentType: 'Original PO',
      documentNo: poNumber,
      documentId: null,
      date: '-',
      quantity: 0,
      cumulativeInvoice: 0,
      cumulativeGrn: 0,
      pendingDelivery: 0,
    });
  }

  const events = [
    ...invoices.map((invoice) => ({
      kind: 'invoice',
      doc: invoice,
      date: invoice.invoiceDate,
      quantity: (invoice.items || []).reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0
      ),
    })),
    ...grns.map((grn) => ({
      kind: 'grn',
      doc: grn,
      date: grn.grnDate,
      quantity: (grn.items || []).reduce(
        (total, item) => total + (Number(item.receivedQuantity) || 0),
        0
      ),
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let cumulativeInvoice = 0;
  let cumulativeGrn = 0;

  for (const event of events) {
    if (event.kind === 'invoice') {
      cumulativeInvoice += event.quantity;

      rows.push({
        documentType: 'Invoice',
        documentNo: event.doc.invoiceNumber,
        documentId: String(event.doc._id),
        date: formatDate(event.doc.invoiceDate),
        quantity: event.quantity,
        cumulativeInvoice,
        cumulativeGrn,
        pendingDelivery: Math.max(poQty - cumulativeGrn, 0),
      });
    } else {
      cumulativeGrn += event.quantity;

      rows.push({
        documentType: 'GRN',
        documentNo: event.doc.grnNumber,
        documentId: String(event.doc._id),
        date: formatDate(event.doc.grnDate),
        quantity: event.quantity,
        cumulativeInvoice,
        cumulativeGrn,
        pendingDelivery: Math.max(poQty - cumulativeGrn, 0),
      });
    }
  }

  return {
    rows,
    currentStatus: {
      remainingQty: Math.max(poQty - cumulativeGrn, 0),
      cumulativeInvoiceQty: cumulativeInvoice,
      cumulativeGrnQty: cumulativeGrn,
      pendingDelivery: Math.max(poQty - cumulativeGrn, 0),
    },
  };
}

async function getSummaryByPoNumber(poNumber) {
  const fetched = await Promise.all([
    PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Grn.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Invoice.find({ poNumber }).sort({ createdAt: 1 }).lean(),
  ]).then(([purchaseOrders, grns, invoices]) => ({ purchaseOrders, grns, invoices }));

  if (
    fetched.purchaseOrders.length === 0 &&
    fetched.grns.length === 0 &&
    fetched.invoices.length === 0
  ) {
    throw new ApiError(404, 'NOT_FOUND', `No documents found for PO number ${poNumber}`);
  }

  const { purchaseOrders, grns, invoices } = await liveResolvePoBundle(fetched);
  const referencePo = purchaseOrders[0] ?? null;
  const allDocuments = referencePo ? [referencePo, ...grns, ...invoices] : [...grns, ...invoices];
  const skuRateMap = await buildSkuRateMap(allDocuments);

  const { rows, currentStatus } = buildSummaryRows(poNumber, referencePo, invoices, grns);

  return {
    poNumber,
    poAmount: referencePo ? roundCurrency(sumPoAmount(referencePo, skuRateMap)) : 0,
    totalInvoiced: roundCurrency(sumInvoiceAmount(invoices)),
    totalReceived: roundCurrency(sumReceivedAmount(grns, skuRateMap)),
    rows,
    currentStatus,
  };
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export { getSummaryByPoNumber };
