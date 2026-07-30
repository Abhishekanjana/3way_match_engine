const mongoose = require('mongoose');
const { createApp } = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;

async function ensureSampleCatalogSeeded() {
  if (config.env !== 'development') {
    return;
  }

  const SkuMaster = require('./models/SkuMaster');
  const skuCount = await SkuMaster.countDocuments();

  if (skuCount > 0) {
    return;
  }

  const { seedSkuMasters, reresolveDocumentItems } = require('./services/catalogSeed.service');
  const PurchaseOrder = require('./models/PurchaseOrder');
  const Grn = require('./models/Grn');
  const Invoice = require('./models/Invoice');

  await seedSkuMasters();
  await reresolveDocumentItems(PurchaseOrder);
  await reresolveDocumentItems(Grn);
  await reresolveDocumentItems(Invoice);
  logger.info('Seeded sample SKU Master catalogue and re-resolved document items');
}

async function startServer() {
  await mongoose.connect(config.mongoose.url);
  logger.info('MongoDB connected');

  await ensureSampleCatalogSeeded();

  if (!config.gemini.apiKey) {
    logger.warn('GEMINI_API_KEY not set — document parsing will be unavailable');
  }

  const app = createApp();
  server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`, { env: config.env });
  });

  // Document parsing via Gemini can take several minutes.
  server.timeout = 10 * 60 * 1000;
  server.keepAliveTimeout = 10 * 60 * 1000 + 1000;
  server.headersTimeout = 10 * 60 * 1000 + 2000;
}

function exitHandler() {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

function unexpectedErrorHandler(error) {
  logger.error('Unexpected error', { message: error.message, stack: error.stack });
}

process.on('uncaughtException', (error) => {
  unexpectedErrorHandler(error);
  exitHandler();
});
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

startServer().catch((err) => {
  logger.error('Failed to start server', { message: err.message, stack: err.stack });
  process.exit(1);
});
