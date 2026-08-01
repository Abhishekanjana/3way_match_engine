import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeInvoicesByNumber } from '../src/utils/documentDedup.js';
import { computeMatch, REASON_CODES } from '../src/services/matchEngine.service.js';
import { MATCH_STATUS } from '../src/utils/reasonCodes.js';

const SKU_ID = '507f1f77bcf86cd799439011';

function sku() {
  return {
    _id: SKU_ID,
    skuErpCode: 'FG001',
    name: 'Sample SKU',
    agreedRate: 100,
    mrp: 120,
    priceTolerance: 0.05,
  };
}

function po() {
  return {
    _id: 'po1',
    poNumber: 'PO-1',
    poDate: new Date('2026-03-17'),
    createdAt: new Date('2026-03-17'),
    items: [{ itemCode: 'FG001', description: 'Item', quantity: 10, skuMaster: SKU_ID }],
  };
}

function grn() {
  return {
    _id: 'grn1',
    grnNumber: 'GRN-1',
    poNumber: 'PO-1',
    grnDate: new Date('2026-03-18'),
    createdAt: new Date('2026-03-18'),
    items: [
      { itemCode: 'FG001', description: 'Item', receivedQuantity: 10, mrp: 120, skuMaster: SKU_ID },
    ],
  };
}

function invoice(overrides = {}) {
  return {
    _id: 'inv1',
    invoiceNumber: 'INV-1',
    poNumber: 'PO-1',
    invoiceDate: new Date('2026-03-17'),
    createdAt: new Date('2026-03-19'),
    items: [
      {
        itemCode: 'FG001',
        description: 'Item',
        quantity: 10,
        unitRate: 100,
        mrp: 120,
        skuMaster: SKU_ID,
      },
    ],
    ...overrides,
  };
}

describe('dedupeInvoicesByNumber', () => {
  it('keeps the earliest invoice per invoice number', () => {
    const first = invoice({
      _id: 'inv-first',
      createdAt: new Date('2026-03-19T10:00:00Z'),
      items: [{ itemCode: 'FG001', description: 'Item', quantity: 10, skuMaster: SKU_ID }],
    });
    const second = invoice({
      _id: 'inv-second',
      createdAt: new Date('2026-03-19T12:00:00Z'),
      items: [{ itemCode: 'FG001', description: 'Item', quantity: 99, skuMaster: SKU_ID }],
    });

    const { unique, duplicates } = dedupeInvoicesByNumber([second, first]);

    assert.equal(unique.length, 1);
    assert.equal(String(unique[0]._id), 'inv-first');
    assert.equal(duplicates.length, 1);
    assert.equal(String(duplicates[0]._id), 'inv-second');
  });

  it('treats invoice numbers case-insensitively', () => {
    const first = invoice({ invoiceNumber: 'inv-1', createdAt: new Date('2026-03-19T10:00:00Z') });
    const second = invoice({
      _id: 'inv2',
      invoiceNumber: 'INV-1',
      createdAt: new Date('2026-03-19T11:00:00Z'),
    });

    const { unique, duplicates } = dedupeInvoicesByNumber([first, second]);

    assert.equal(unique.length, 1);
    assert.equal(duplicates.length, 1);
  });
});

describe('computeMatch with deduped invoices', () => {
  it('does not double-count quantities when duplicate invoice numbers are deduped', () => {
    const first = invoice({
      _id: 'inv-first',
      createdAt: new Date('2026-03-19T10:00:00Z'),
      items: [
        {
          itemCode: 'FG001',
          description: 'Item',
          quantity: 10,
          unitRate: 100,
          mrp: 120,
          skuMaster: SKU_ID,
        },
      ],
    });
    const second = invoice({
      _id: 'inv-second',
      createdAt: new Date('2026-03-19T12:00:00Z'),
      items: [
        {
          itemCode: 'FG001',
          description: 'Item',
          quantity: 99,
          unitRate: 100,
          mrp: 120,
          skuMaster: SKU_ID,
        },
      ],
    });

    const withoutDedupe = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [first, second],
      skuMasters: [sku()],
    });

    const { unique } = dedupeInvoicesByNumber([first, second]);
    const withDedupe = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: unique,
      skuMasters: [sku()],
    });

    assert.equal(withoutDedupe.status, MATCH_STATUS.MISMATCH);
    assert.ok(
      withoutDedupe.reasons.some((reason) => reason.code === REASON_CODES.DUPLICATE_DOCUMENT)
    );

    assert.equal(withDedupe.status, MATCH_STATUS.MATCHED);
    assert.equal(withDedupe.items[0].invoiceQty, 10);
    assert.ok(!withDedupe.reasons.some((reason) => reason.code === REASON_CODES.DUPLICATE_DOCUMENT));
  });
});
