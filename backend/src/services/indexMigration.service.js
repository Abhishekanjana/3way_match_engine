const Invoice = require('../models/Invoice');
const Grn = require('../models/Grn');
const logger = require('../config/logger');

const STALE_UNIQUE_INDEXES = [
  { model: Invoice, name: 'poNumber_1_invoiceNumber_1' },
  { model: Grn, name: 'poNumber_1_grnNumber_1' },
];

async function dropStaleUniqueIndex(model, indexName) {
  const collection = model.collection;

  try {
    const indexes = await collection.indexes();
    const existing = indexes.find((index) => index.name === indexName);

    if (!existing) {
      return;
    }

    if (!existing.unique) {
      return;
    }

    await collection.dropIndex(indexName);
    logger.info(`Dropped stale unique index: ${indexName}`);
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      return;
    }

    throw error;
  }
}

async function ensureDuplicateFriendlyIndexes() {
  for (const { model, name } of STALE_UNIQUE_INDEXES) {
    await dropStaleUniqueIndex(model, name);
  }

  await Invoice.syncIndexes();
  await Grn.syncIndexes();
}

module.exports = { ensureDuplicateFriendlyIndexes };
