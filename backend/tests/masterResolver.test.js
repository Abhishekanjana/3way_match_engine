const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  lookupSkuMasterId,
  normalizeText,
} = require('../src/services/masterResolver.service');

describe('lookupSkuMasterId', () => {
  it('matches skuErpCode first, then eanCode, case-insensitively', () => {
    const skuId = '507f1f77bcf86cd799439011';
    const maps = {
      byErp: new Map([['fg001', skuId]]),
      byEan: new Map([['8901234567890', skuId]]),
      byName: new Map(),
      byAlias: new Map(),
      nameEntries: [],
    };

    assert.equal(lookupSkuMasterId({ itemCode: 'FG001' }, maps), skuId);
    assert.equal(lookupSkuMasterId({ itemCode: '8901234567890' }, maps), skuId);
    assert.equal(lookupSkuMasterId({ itemCode: '  fg001  ' }, maps), skuId);
    assert.equal(lookupSkuMasterId({ itemCode: 'missing' }, maps), null);
  });

  it('matches by product description against sku name', () => {
    const skuId = '507f1f77bcf86cd799439012';
    const nameKey = normalizeText('Bikaji Bikaneri Bhujia 200 G Pp');
    const maps = {
      byErp: new Map(),
      byEan: new Map(),
      byName: new Map([[nameKey, skuId]]),
      byAlias: new Map(),
      nameEntries: [{ key: nameKey, id: skuId }],
    };

    assert.equal(
      lookupSkuMasterId(
        { itemCode: 'UNKNOWN', description: 'Bikaji Bikaneri Bhujia 200 G Pp' },
        maps
      ),
      skuId
    );
  });

  it('matches by alias token when erp code differs', () => {
    const skuId = '507f1f77bcf86cd799439013';
    const aliasKey = normalizeText('BIK-BIKANERI-200G');
    const maps = {
      byErp: new Map(),
      byEan: new Map(),
      byName: new Map(),
      byAlias: new Map([[aliasKey, skuId]]),
      nameEntries: [],
    };

    assert.equal(lookupSkuMasterId({ itemCode: 'BIK-BIKANERI-200G' }, maps), skuId);
  });

  it('partially matches long description text to sku name', () => {
    const skuId = '507f1f77bcf86cd799439014';
    const nameKey = normalizeText('Cheesy Spicy Veg Momos 24.0 Pieces');
    const maps = {
      byErp: new Map(),
      byEan: new Map(),
      byName: new Map([[nameKey, skuId]]),
      byAlias: new Map(),
      nameEntries: [{ key: nameKey, id: skuId }],
    };

    assert.equal(
      lookupSkuMasterId(
        {
          itemCode: 'X',
          description: 'Cheesy Spicy Veg Momos 24.0 Pieces bulk pack',
        },
        maps
      ),
      skuId
    );
  });
});

describe('masterResolver.normalizeCode', () => {
  it('trims and lowercases item codes', () => {
    const { normalizeCode } = require('../src/services/masterResolver.service');
    assert.equal(normalizeCode('  ABC123  '), 'abc123');
  });

  it('normalizes description text for matching', () => {
    assert.equal(normalizeText('BIK-BIKANERI-200G'), 'bikbikaneri200g');
    assert.equal(normalizeText('Bikaji Bikaneri Bhujia 200 G Pp'), 'bikajibikaneribhujia200gpp');
  });
});
