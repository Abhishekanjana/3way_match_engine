const mongoose = require('mongoose');
const config = require('../config/config');
const SkuMaster = require('../models/SkuMaster');
const { SAMPLE_SKU_MASTERS } = require('../data/sampleSkuMaster');
const { reresolveAllDocuments } = require('./documentResolve.service');

async function seedSkuMasters() {
  await SkuMaster.deleteMany({});
  await SkuMaster.insertMany(SAMPLE_SKU_MASTERS);
  return SkuMaster.countDocuments();
}

async function seedAndReresolve() {
  await mongoose.connect(config.mongoose.url);

  const skuCount = await seedSkuMasters();
  const reresolved = await reresolveAllDocuments();

  return { skuCount, ...reresolved };
}

module.exports = { seedSkuMasters, seedAndReresolve };
