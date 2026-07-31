/**
 * Drops stale UNIQUE compound indexes on invoices/grns so duplicate documents
 * can be stored per assignment spec (surfaced via duplicate_document on GET /match).
 *
 * Run: node scripts/fix-duplicate-indexes.js
 */
import mongoose from 'mongoose';
import config from '../src/config/config.js';
import logger from '../src/config/logger.js';
import Invoice from '../src/models/Invoice.js';
import Grn from '../src/models/Grn.js';

const STALE_UNIQUE_INDEXES = [
  { model: Invoice, collection: 'invoices', name: 'poNumber_1_invoiceNumber_1' },
  { model: Grn, collection: 'grns', name: 'poNumber_1_grnNumber_1' },
];

async function dropStaleUniqueIndex(model, indexName) {
  const collection = model.collection;

  try {
    const indexes = await collection.indexes();
    const existing = indexes.find((index) => index.name === indexName);

    if (!existing) {
      logger.info(`Index not found (already removed): ${indexName}`);
      return;
    }

    if (!existing.unique) {
      logger.info(`Index already non-unique: ${indexName}`);
      return;
    }

    await collection.dropIndex(indexName);
    logger.info(`Dropped stale unique index: ${indexName}`);
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      logger.info(`Index not found (already removed): ${indexName}`);
      return;
    }

    throw error;
  }
}

async function syncDocumentIndexes() {
  await Invoice.syncIndexes();
  await Grn.syncIndexes();
  logger.info('Synced non-unique compound indexes for invoices and grns');
}

async function main() {
  await mongoose.connect(config.mongoose.url);
  logger.info('Connected to MongoDB');

  for (const { model, name } of STALE_UNIQUE_INDEXES) {
    await dropStaleUniqueIndex(model, name);
  }

  await syncDocumentIndexes();
  logger.info('Duplicate index fix complete — re-uploads with same poNumber + document number will persist');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  logger.error('Duplicate index fix failed', { message: error.message, stack: error.stack });
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
