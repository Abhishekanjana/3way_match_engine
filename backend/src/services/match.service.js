const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const SkuMaster = require('../models/SkuMaster');
const ApiError = require('../utils/ApiError');
const { computeMatch } = require('./matchEngine.service');
const { liveResolvePoBundle } = require('./documentResolve.service');
const { HARD_VIOLATION_CODES, SOFT_WARNING_CODES } = require('../utils/reasonCodes');

async function fetchDocumentsByPoNumber(poNumber) {
  const [purchaseOrders, grns, invoices] = await Promise.all([
    PurchaseOrder.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Grn.find({ poNumber }).sort({ createdAt: 1 }).lean(),
    Invoice.find({ poNumber }).sort({ createdAt: 1 }).lean(),
  ]);

  return { purchaseOrders, grns, invoices };
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
  const fetched = await fetchDocumentsByPoNumber(poNumber);

  if (
    fetched.purchaseOrders.length === 0 &&
    fetched.grns.length === 0 &&
    fetched.invoices.length === 0
  ) {
    throw new ApiError(404, 'NOT_FOUND', `No documents found for PO number ${poNumber}`);
  }

  const { purchaseOrders, grns, invoices } = await liveResolvePoBundle(fetched);
  const skuMasters = await SkuMaster.find({}).lean();
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

module.exports = { getMatchByPoNumber, fetchDocumentsByPoNumber };
