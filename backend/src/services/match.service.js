const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const SkuMaster = require('../models/SkuMaster');
const ApiError = require('../utils/ApiError');
const { computeMatch } = require('./matchEngine.service');
const { HARD_VIOLATION_CODES, SOFT_WARNING_CODES } = require('../utils/reasonCodes');

async function fetchDocumentsByPoNumber(poNumber) {
  const [purchaseOrders, grns, invoices] = await Promise.all([
    PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Grn.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Invoice.find({ poNumber }).sort({ createdAt: 1 }).lean(),
  ]);

  return { purchaseOrders, grns, invoices };
}

async function loadSkuMasters(documents) {
  const skuIds = new Set();

  for (const collection of documents) {
    for (const doc of collection) {
      for (const item of doc.items || []) {
        if (item.skuMaster) {
          skuIds.add(String(item.skuMaster));
        }
      }
    }
  }

  if (skuIds.size === 0) {
    return [];
  }

  return SkuMaster.find({ _id: { $in: [...skuIds] } }).lean();
}

function mapDocumentRef(doc, type) {
  const base = {
    id: String(doc._id),
    type,
    createdAt: doc.createdAt,
  };

  if (type === 'po') {
    return { ...base, number: doc.poNumber, date: doc.poDate };
  }

  if (type === 'grn') {
    return { ...base, number: doc.grnNumber, date: doc.grnDate };
  }

  return { ...base, number: doc.invoiceNumber, date: doc.invoiceDate };
}

function enrichReasonLevels(reasons) {
  return reasons.map((reason) => ({
    ...reason,
    level: HARD_VIOLATION_CODES.has(reason.code)
      ? 'hard'
      : SOFT_WARNING_CODES.has(reason.code)
        ? 'soft'
        : 'info',
  }));
}

async function getMatchByPoNumber(poNumber) {
  const { purchaseOrders, grns, invoices } = await fetchDocumentsByPoNumber(poNumber);

  if (
    purchaseOrders.length === 0 &&
    grns.length === 0 &&
    invoices.length === 0
  ) {
    throw new ApiError(404, 'NOT_FOUND', `No documents found for PO number ${poNumber}`);
  }

  const skuMasters = await loadSkuMasters([purchaseOrders, grns, invoices]);
  const matchResult = computeMatch({ purchaseOrders, grns, invoices, skuMasters });

  return {
    poNumber,
    status: matchResult.status,
    reasons: enrichReasonLevels(matchResult.reasons),
    linkedDocuments: {
      purchaseOrders: purchaseOrders.map((doc) => mapDocumentRef(doc, 'po')),
      grns: grns.map((doc) => mapDocumentRef(doc, 'grn')),
      invoices: invoices.map((doc) => mapDocumentRef(doc, 'invoice')),
    },
    items: matchResult.items,
  };
}

module.exports = { getMatchByPoNumber };
