import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatItemReasonMessage } from '../src/utils/reasonMessages.js';
import { REASON_CODES } from '../src/utils/reasonCodes.js';

describe('formatItemReasonMessage', () => {
  const item = {
    itemCode: '11423',
    description: 'Cheesy Spicy Veg Momos',
    poQty: 50,
    grnQty: 60,
    invoiceQty: 55,
    unitRate: 220,
    mrp: 305,
    skuMaster: {
      skuErpCode: '11423',
      agreedRate: 200,
      mrp: 300,
      priceTolerance: 0.05,
    },
  };

  it('formats quantity exceed messages with SKU and quantities', () => {
    assert.equal(
      formatItemReasonMessage(REASON_CODES.GRN_QTY_EXCEEDS_PO_QTY, item),
      'GRN received 60 exceeds PO ordered 50 for SKU 11423'
    );
    assert.equal(
      formatItemReasonMessage(REASON_CODES.INVOICE_QTY_EXCEEDS_GRN_QTY, item),
      'Invoice qty 55 exceeds GRN received 60 for SKU 11423'
    );
    assert.equal(
      formatItemReasonMessage(REASON_CODES.INVOICE_QTY_EXCEEDS_PO_QTY, item),
      'Invoice qty 55 exceeds PO ordered 50 for SKU 11423'
    );
  });

  it('formats soft warnings with context', () => {
    assert.match(
      formatItemReasonMessage(REASON_CODES.PRICE_MISMATCH, item),
      /Invoice rate 220 is outside 5% tolerance vs agreed rate 200 for SKU 11423/
    );
    assert.equal(
      formatItemReasonMessage(REASON_CODES.MRP_MISMATCH, item),
      'MRP 305 differs from master MRP 300 for SKU 11423'
    );
    assert.equal(
      formatItemReasonMessage(REASON_CODES.UNMAPPED_MASTER_SKU, item),
      'SKU 11423 (Cheesy Spicy Veg Momos) is not linked to SKU Master'
    );
  });
});
