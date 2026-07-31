/**
 * Wipes uploaded files and all MongoDB document data.
 * Preserves: AUTH_TOKEN in .env (not stored in DB), seedSkuMaster.js + sampleSkuMaster.js
 *
 * Run: npm run reset:data
 * Then re-seed SKU catalogue: npm run seed:sku
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import config from '../src/config/config.js';
import logger from '../src/config/logger.js';
import PurchaseOrder from '../src/models/PurchaseOrder.js';
import Grn from '../src/models/Grn.js';
import Invoice from '../src/models/Invoice.js';
import UploadJob from '../src/models/UploadJob.js';
import MatchAudit from '../src/models/MatchAudit.js';
import SkuMaster from '../src/models/SkuMaster.js';

function clearUploadFiles(uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    return 0;
  }

  let removed = 0;

  for (const entry of fs.readdirSync(uploadDir)) {
    const fullPath = path.join(uploadDir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
      fs.unlinkSync(fullPath);
      removed += 1;
    }
  }

  return removed;
}

async function clearDatabase() {
  const [po, grn, invoice, jobs, audit, sku] = await Promise.all([
    PurchaseOrder.deleteMany({}),
    Grn.deleteMany({}),
    Invoice.deleteMany({}),
    UploadJob.deleteMany({}),
    MatchAudit.deleteMany({}),
    SkuMaster.deleteMany({}),
  ]);

  return {
    purchaseOrders: po.deletedCount,
    grns: grn.deletedCount,
    invoices: invoice.deletedCount,
    uploadJobs: jobs.deletedCount,
    matchAudits: audit.deletedCount,
    skuMasters: sku.deletedCount,
  };
}

async function main() {
  const uploadDir = config.upload.dir;

  await mongoose.connect(config.mongoose.url);
  logger.info('Connected to MongoDB');

  const dbCounts = await clearDatabase();
  const filesRemoved = clearUploadFiles(uploadDir);

  logger.info('Database cleared', dbCounts);
  logger.info(`Removed ${filesRemoved} file(s) from ${uploadDir}`);
  logger.info('Auth token unchanged (see AUTH_TOKEN in .env)');
  logger.info('To restore SKU catalogue run: npm run seed:sku');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  logger.error('Reset failed', { message: error.message, stack: error.stack });
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
