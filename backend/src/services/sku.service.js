const SkuMaster = require('../models/SkuMaster');
const ApiError = require('../utils/ApiError');

async function createSku(payload) {
  return SkuMaster.create(payload);
}

async function listSkus() {
  return SkuMaster.find().sort({ skuErpCode: 1 }).lean();
}

async function getSkuById(id) {
  const sku = await SkuMaster.findById(id).lean();
  if (!sku) {
    throw new ApiError(404, 'NOT_FOUND', 'SKU Master record not found');
  }
  return sku;
}

async function updateSku(id, payload) {
  const sku = await SkuMaster.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!sku) {
    throw new ApiError(404, 'NOT_FOUND', 'SKU Master record not found');
  }

  return sku;
}

async function deleteSku(id) {
  const sku = await SkuMaster.findByIdAndDelete(id).lean();
  if (!sku) {
    throw new ApiError(404, 'NOT_FOUND', 'SKU Master record not found');
  }
  return sku;
}

module.exports = { createSku, listSkus, getSkuById, updateSku, deleteSku };
