const SkuMaster = require('../models/SkuMaster');

function normalizeCode(value) {
  return String(value ?? '').trim().toLowerCase();
}

/** Strip punctuation/spaces for description and name matching (e.g. Bikaji vs BIK-BIKANERI). */
function normalizeText(value) {
  return normalizeCode(value).replace(/[^a-z0-9]+/g, '');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MIN_PARTIAL_MATCH_LEN = 8;

async function buildSkuLookupMaps() {
  const allSkus = await SkuMaster.find({}).lean();
  const byErp = new Map();
  const byEan = new Map();
  const byName = new Map();
  const byAlias = new Map();
  const nameEntries = [];

  for (const sku of allSkus) {
    if (sku.skuErpCode) {
      byErp.set(normalizeCode(sku.skuErpCode), sku._id);
      const erpText = normalizeText(sku.skuErpCode);
      if (erpText) {
        byAlias.set(erpText, sku._id);
      }
    }

    if (sku.eanCode) {
      byEan.set(normalizeCode(sku.eanCode), sku._id);
    }

    if (sku.name) {
      const nameKey = normalizeText(sku.name);
      if (nameKey) {
        byName.set(nameKey, sku._id);
        nameEntries.push({ key: nameKey, id: sku._id });
      }
    }

    for (const alias of sku.aliases || []) {
      const aliasKey = normalizeText(alias);
      if (aliasKey) {
        byAlias.set(aliasKey, sku._id);
      }
    }
  }

  return { byErp, byEan, byName, byAlias, nameEntries };
}

function splitTokens(value) {
  return String(value ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function lookupByPartialText(normalizedValue, nameEntries) {
  if (!normalizedValue || normalizedValue.length < MIN_PARTIAL_MATCH_LEN) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of nameEntries) {
    if (
      normalizedValue.includes(entry.key) ||
      entry.key.includes(normalizedValue)
    ) {
      return entry.id;
    }

    const valueTokens = splitTokens(normalizedValue);
    const nameTokens = splitTokens(entry.key);

    if (valueTokens.length === 0 || nameTokens.length === 0) {
      continue;
    }

    const nameTokenSet = new Set(nameTokens);
    const overlap = valueTokens.filter((token) => nameTokenSet.has(token)).length;
    const score = overlap / Math.max(valueTokens.length, nameTokens.length);

    if (score >= 0.65 && score > bestScore) {
      bestScore = score;
      bestMatch = entry.id;
    }
  }

  return bestMatch;
}

function lookupSkuMasterId(item, maps) {
  const itemCode = item?.itemCode;
  const description = item?.description;
  const normalizedCode = normalizeCode(itemCode);

  if (normalizedCode) {
    const byCode = maps.byErp.get(normalizedCode) ?? maps.byEan.get(normalizedCode);
    if (byCode) {
      return byCode;
    }
  }

  const textCandidates = [description, itemCode]
    .map(normalizeText)
    .filter(Boolean);

  for (const key of textCandidates) {
    const exact =
      maps.byName.get(key) ?? maps.byAlias.get(key) ?? maps.byErp.get(key) ?? maps.byEan.get(key);

    if (exact) {
      return exact;
    }
  }

  for (const key of textCandidates) {
    const partial = lookupByPartialText(key, maps.nameEntries);
    if (partial) {
      return partial;
    }
  }

  const rawText = [description, itemCode].filter(Boolean).join(' ');
  const rawTokens = splitTokens(rawText);

  if (rawTokens.length >= 3) {
    let bestMatch = null;
    let bestScore = 0;

    for (const entry of maps.nameEntries) {
      const nameTokens = splitTokens(entry.key);
      const nameTokenSet = new Set(nameTokens);
      const overlap = rawTokens.filter((token) => nameTokenSet.has(token)).length;
      const score = overlap / Math.max(rawTokens.length, nameTokens.length);

      if (score >= 0.65 && score > bestScore) {
        bestScore = score;
        bestMatch = entry.id;
      }
    }

    if (bestMatch) {
      return bestMatch;
    }
  }

  return null;
}

async function resolveItemToMaster(itemCode, description = '') {
  const maps = await buildSkuLookupMaps();
  return lookupSkuMasterId({ itemCode, description }, maps);
}

async function resolveItems(items) {
  const maps = await buildSkuLookupMaps();

  return items.map((item) => ({
    ...item,
    skuMaster: lookupSkuMasterId(item, maps),
  }));
}

module.exports = {
  resolveItemToMaster,
  resolveItems,
  normalizeCode,
  normalizeText,
  lookupSkuMasterId,
  buildSkuLookupMaps,
};
