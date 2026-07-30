const mongoose = require('mongoose');
const config = require('../config/config');
const SkuMaster = require('../models/SkuMaster');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const { SAMPLE_SKU_MASTERS } = require('../data/sampleSkuMaster');
const { resolveItems } = require('../services/masterResolver.service');

async function seedSkuMasters() {
  await SkuMaster.deleteMany({});
  await SkuMaster.insertMany(SAMPLE_SKU_MASTERS);
  return SkuMaster.countDocuments();
}

async function reresolveDocumentItems(Model) {
  const documents = await Model.find({});
  let updated = 0;

  for (const document of documents) {
    const plainItems = document.items.map((item) =>
      typeof item.toObject === 'function' ? item.toObject() : { ...item }
    );

    document.items = await resolveItems(plainItems);
    await document.save();
    updated += 1;
  }

  return updated;
}

async function seedAndReresolve() {
  await mongoose.connect(config.mongoose.url);

  const skuCount = await seedSkuMasters();
  const poCount = await reresolveDocumentItems(PurchaseOrder);
  const grnCount = await reresolveDocumentItems(Grn);
  const invoiceCount = await reresolveDocumentItems(Invoice);

  return { skuCount, poCount, grnCount, invoiceCount };
}

module.exports = { seedSkuMasters, reresolveDocumentItems, seedAndReresolve };
