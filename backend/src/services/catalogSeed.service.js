import mongoose from 'mongoose';
import config from '../config/config.js';
import SkuMaster from '../models/SkuMaster.js';
import { SAMPLE_SKU_MASTERS } from '../data/sampleSkuMaster.js';
import { reresolveAllDocuments } from './documentResolve.service.js';

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

export { seedSkuMasters, seedAndReresolve };
