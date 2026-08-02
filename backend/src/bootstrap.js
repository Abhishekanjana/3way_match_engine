import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import SkuMaster from './models/SkuMaster.js';
import { seedSkuMasters } from './services/catalogSeed.service.js';
import { scheduleReresolveAllDocuments } from './services/documentResolve.service.js';
import { ensureDuplicateFriendlyIndexes } from './services/indexMigration.service.js';

let app;
let bootstrapPromise;

async function ensureSampleCatalogSeeded() {
  if (config.env !== 'development') {
    return;
  }

  const skuCount = await SkuMaster.countDocuments();

  if (skuCount > 0) {
    return;
  }

  await seedSkuMasters();
  scheduleReresolveAllDocuments();
  logger.info('Seeded sample SKU Master catalogue; document re-resolution queued');
}

async function bootstrapApp() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    await connectDatabase();
    await ensureDuplicateFriendlyIndexes();
    await ensureSampleCatalogSeeded();

    if (!config.gemini.apiKey) {
      logger.warn('GEMINI_API_KEY not set — document parsing will be unavailable');
    }

    app = createApp();
    return app;
  })();

  return bootstrapPromise;
}

async function getApp() {
  return bootstrapApp();
}

export { getApp, bootstrapApp };
