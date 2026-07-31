import logger from '../config/logger.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Grn from '../models/Grn.js';
import Invoice from '../models/Invoice.js';
import {
  resolveItems,
  buildSkuLookupMaps,
  lookupSkuMasterId,
} from './masterResolver.service.js';

function stripSkuMaster(items) {
  return (items || []).map((item) => {
    const plain = typeof item.toObject === 'function' ? item.toObject() : { ...item };
    const { skuMaster: _ignored, ...rest } = plain;
    return rest;
  });
}

function resolveItemsWithMaps(items, maps) {
  return stripSkuMaster(items).map((item) => ({
    ...item,
    skuMaster: lookupSkuMasterId(item, maps),
  }));
}

async function liveResolveDocuments(documents) {
  const maps = await buildSkuLookupMaps();
  return documents.map((doc) => ({
    ...doc,
    items: resolveItemsWithMaps(doc.items, maps),
  }));
}

async function liveResolvePoBundle({ purchaseOrders = [], grns = [], invoices = [] }) {
  const maps = await buildSkuLookupMaps();

  const resolveCollection = (documents) =>
    documents.map((doc) => ({
      ...doc,
      items: resolveItemsWithMaps(doc.items, maps),
    }));

  return {
    purchaseOrders: resolveCollection(purchaseOrders),
    grns: resolveCollection(grns),
    invoices: resolveCollection(invoices),
  };
}

async function reresolveDocumentItems(Model, filter = {}) {
  const maps = await buildSkuLookupMaps();
  const documents = await Model.find(filter).select('_id items');
  const bulkOps = [];

  for (const document of documents) {
    bulkOps.push({
      updateOne: {
        filter: { _id: document._id },
        update: {
          $set: {
            items: resolveItemsWithMaps(document.items, maps),
          },
        },
      },
    });
  }

  if (bulkOps.length > 0) {
    await Model.bulkWrite(bulkOps);
  }

  return bulkOps.length;
}

async function reresolveDocumentsByPoNumber(poNumber) {
  const filter = { poNumber };

  return {
    po: await reresolveDocumentItems(PurchaseOrder, filter),
    grn: await reresolveDocumentItems(Grn, filter),
    invoice: await reresolveDocumentItems(Invoice, filter),
  };
}

async function reresolveAllDocuments() {
  return {
    po: await reresolveDocumentItems(PurchaseOrder),
    grn: await reresolveDocumentItems(Grn),
    invoice: await reresolveDocumentItems(Invoice),
  };
}

let reresolveScheduled = false;
let reresolveRunning = false;

function scheduleReresolveAllDocuments() {
  if (reresolveScheduled) {
    return;
  }

  reresolveScheduled = true;

  setImmediate(async () => {
    reresolveScheduled = false;

    if (reresolveRunning) {
      scheduleReresolveAllDocuments();
      return;
    }

    reresolveRunning = true;

    try {
      await reresolveAllDocuments();
      logger.info('Background SKU re-resolution completed');
    } catch (error) {
      logger.warn('Background SKU re-resolution failed', { message: error.message });
    } finally {
      reresolveRunning = false;
    }
  });
}

export {
  liveResolveDocuments,
  liveResolvePoBundle,
  reresolveDocumentItems,
  reresolveDocumentsByPoNumber,
  reresolveAllDocuments,
  scheduleReresolveAllDocuments,
};
