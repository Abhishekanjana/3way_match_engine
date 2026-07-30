const SkuMaster = require('../models/SkuMaster');

function normalizeCode(value) {
  return String(value ?? '').trim().toLowerCase();
}

async function resolveItemToMaster(itemCode) {
  const normalized = normalizeCode(itemCode);

  if (!normalized) {
    return null;
  }

  const byErp = await SkuMaster.findOne({
    skuErpCode: { $regex: new RegExp(`^${escapeRegex(itemCode.trim())}$`, 'i') },
  });

  if (byErp) {
    return byErp._id;
  }

  const byEan = await SkuMaster.findOne({
    eanCode: { $regex: new RegExp(`^${escapeRegex(itemCode.trim())}$`, 'i') },
  });

  return byEan ? byEan._id : null;
}

async function resolveItems(items) {
  const resolved = [];

  for (const item of items) {
    const skuMasterId = await resolveItemToMaster(item.itemCode);
    resolved.push({ ...item, skuMaster: skuMasterId });
  }

  return resolved;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { resolveItemToMaster, resolveItems, normalizeCode };
