import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMatch, REASON_CODES } from '../src/services/matchEngine.service.js';
import { MATCH_STATUS } from '../src/utils/reasonCodes.js';
import { normalizeCode } from '../src/services/masterResolver.service.js';

const SKU_ID = '507f1f77bcf86cd799439011';
const SKU_ID_2 = '507f1f77bcf86cd799439012';

function sku(overrides = {}) {
  return {
    _id: SKU_ID,
    skuErpCode: 'FG001',
    name: 'Sample SKU',
    eanCode: '8901234567890',
    agreedRate: 100,
    mrp: 120,
    priceTolerance: 0.05,
    ...overrides,
  };
}

function po(overrides = {}) {
  return {
    _id: 'po1',
    poNumber: 'PO-1',
    poDate: new Date('2026-03-17'),
    createdAt: new Date('2026-03-17'),
    items: [{ itemCode: 'FG001', description: 'Item', quantity: 10, skuMaster: SKU_ID }],
    ...overrides,
  };
}

function grn(overrides = {}) {
  return {
    _id: 'grn1',
    grnNumber: 'GRN-1',
    poNumber: 'PO-1',
    grnDate: new Date('2026-03-18'),
    createdAt: new Date('2026-03-18'),
    items: [
      { itemCode: 'FG001', description: 'Item', receivedQuantity: 10, mrp: 120, skuMaster: SKU_ID },
    ],
    ...overrides,
  };
}

function invoice(overrides = {}) {
  return {
    _id: 'inv1',
    invoiceNumber: 'INV-1',
    poNumber: 'PO-1',
    invoiceDate: new Date('2026-03-17'),
    createdAt: new Date('2026-03-17'),
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

describe('computeMatch', () => {
  it('returns insufficient_documents when only PO is present', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [],
      invoices: [],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.INSUFFICIENT_DOCUMENTS);
  });

  it('returns insufficient_documents when PO + GRN only', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.INSUFFICIENT_DOCUMENTS);
  });

  it('returns matched when all three documents fully reconcile with no warnings', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [invoice()],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MATCHED);
    assert.equal(result.reasons.length, 0);
  });

  it('flags grn_qty_exceeds_po_qty as mismatch', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn({ items: [{ itemCode: 'FG001', receivedQuantity: 15, skuMaster: SKU_ID }] })],
      invoices: [invoice()],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.GRN_QTY_EXCEEDS_PO_QTY));
  });

  it('flags invoice_qty_exceeds_grn_qty as mismatch', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [invoice({ items: [{ itemCode: 'FG001', quantity: 15, unitRate: 100, skuMaster: SKU_ID }] })],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(
      result.reasons.some((reason) => reason.code === REASON_CODES.INVOICE_QTY_EXCEEDS_GRN_QTY)
    );
  });

  it('flags invoice_qty_exceeds_po_qty as mismatch', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn({ items: [{ itemCode: 'FG001', receivedQuantity: 10, skuMaster: SKU_ID }] })],
      invoices: [invoice({ items: [{ itemCode: 'FG001', quantity: 15, unitRate: 100, skuMaster: SKU_ID }] })],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(
      result.reasons.some((reason) => reason.code === REASON_CODES.INVOICE_QTY_EXCEEDS_PO_QTY)
    );
  });

  it('flags invoice_date_after_po_date when invoice date is after PO date', () => {
    const result = computeMatch({
      purchaseOrders: [po({ poDate: new Date('2026-03-17') })],
      grns: [grn()],
      invoices: [invoice({ invoiceDate: new Date('2026-03-25') })],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(
      result.reasons.some((reason) => reason.code === REASON_CODES.INVOICE_DATE_AFTER_PO_DATE)
    );
  });

  it('does not flag invoice_date_after_po_date when invoice date equals PO date', () => {
    const sameDay = new Date('2026-03-17');
    const result = computeMatch({
      purchaseOrders: [po({ poDate: sameDay })],
      grns: [grn()],
      invoices: [invoice({ invoiceDate: sameDay })],
      skuMasters: [sku()],
    });

    assert.ok(
      !result.reasons.some((reason) => reason.code === REASON_CODES.INVOICE_DATE_AFTER_PO_DATE)
    );
  });

  it('flags duplicate_po when multiple PO documents exist', () => {
    const result = computeMatch({
      purchaseOrders: [po(), po({ _id: 'po2', createdAt: new Date('2026-03-18') })],
      grns: [grn()],
      invoices: [invoice()],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.DUPLICATE_PO));
  });

  it('flags duplicate_document for duplicate GRN numbers', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn(), grn({ _id: 'grn2' })],
      invoices: [invoice()],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.DUPLICATE_DOCUMENT));
  });

  it('flags duplicate_document for duplicate invoice numbers', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [invoice(), invoice({ _id: 'inv2' })],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.DUPLICATE_DOCUMENT));
  });

  it('flags item_missing_in_po when GRN item is absent from PO', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [
        grn({
          items: [{ itemCode: 'FG999', receivedQuantity: 5, skuMaster: SKU_ID_2 }],
        }),
      ],
      invoices: [invoice()],
      skuMasters: [sku(), sku({ _id: SKU_ID_2, skuErpCode: 'FG999' })],
    });

    assert.equal(result.status, MATCH_STATUS.MISMATCH);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.ITEM_MISSING_IN_PO));
  });

  it('returns partially_matched for price_mismatch beyond tolerance', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [
        invoice({
          items: [{ itemCode: 'FG001', quantity: 10, unitRate: 200, mrp: 120, skuMaster: SKU_ID }],
        }),
      ],
      skuMasters: [sku({ agreedRate: 100, priceTolerance: 0.05 })],
    });

    assert.equal(result.status, MATCH_STATUS.PARTIALLY_MATCHED);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.PRICE_MISMATCH));
  });

  it('returns partially_matched for mrp_mismatch beyond 1%', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn({ items: [{ itemCode: 'FG001', receivedQuantity: 10, mrp: 150, skuMaster: SKU_ID }] })],
      invoices: [invoice({ items: [{ itemCode: 'FG001', quantity: 10, unitRate: 100, mrp: 150, skuMaster: SKU_ID }] })],
      skuMasters: [sku({ mrp: 120 })],
    });

    assert.equal(result.status, MATCH_STATUS.PARTIALLY_MATCHED);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.MRP_MISMATCH));
  });

  it('returns partially_matched for unmapped_master_sku', () => {
    const result = computeMatch({
      purchaseOrders: [po({ items: [{ itemCode: 'UNKNOWN', quantity: 10, skuMaster: null }] })],
      grns: [grn({ items: [{ itemCode: 'UNKNOWN', receivedQuantity: 10, skuMaster: null }] })],
      invoices: [
        invoice({ items: [{ itemCode: 'UNKNOWN', quantity: 10, unitRate: 100, skuMaster: null }] }),
      ],
      skuMasters: [],
    });

    assert.equal(result.status, MATCH_STATUS.PARTIALLY_MATCHED);
    assert.ok(result.reasons.some((reason) => reason.code === REASON_CODES.UNMAPPED_MASTER_SKU));
  });

  it('skips price_mismatch when agreedRate is missing or zero', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [
        invoice({
          items: [{ itemCode: 'FG001', quantity: 10, unitRate: 999, mrp: 120, skuMaster: SKU_ID }],
        }),
      ],
      skuMasters: [sku({ agreedRate: 0 })],
    });

    assert.ok(!result.reasons.some((reason) => reason.code === REASON_CODES.PRICE_MISMATCH));
  });

  it('skips price_mismatch when invoice unitRate is missing', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn()],
      invoices: [
        invoice({
          items: [{ itemCode: 'FG001', quantity: 10, unitRate: null, mrp: 120, skuMaster: SKU_ID }],
        }),
      ],
      skuMasters: [sku()],
    });

    assert.ok(!result.reasons.some((reason) => reason.code === REASON_CODES.PRICE_MISMATCH));
  });

  it('skips mrp_mismatch when MRP is missing', () => {
    const result = computeMatch({
      purchaseOrders: [po()],
      grns: [grn({ items: [{ itemCode: 'FG001', receivedQuantity: 10, mrp: null, skuMaster: SKU_ID }] })],
      invoices: [
        invoice({
          items: [{ itemCode: 'FG001', quantity: 10, unitRate: 100, mrp: null, skuMaster: SKU_ID }],
        }),
      ],
      skuMasters: [sku({ mrp: 120 })],
    });

    assert.ok(!result.reasons.some((reason) => reason.code === REASON_CODES.MRP_MISMATCH));
  });

  it('aggregates quantities for the same SKU on multiple lines', () => {
    const result = computeMatch({
      purchaseOrders: [
        po({
          items: [
            { itemCode: 'FG001', quantity: 4, skuMaster: SKU_ID },
            { itemCode: 'FG001', quantity: 6, skuMaster: SKU_ID },
          ],
        }),
      ],
      grns: [
        grn({
          items: [
            { itemCode: 'FG001', receivedQuantity: 5, skuMaster: SKU_ID },
            { itemCode: 'FG001', receivedQuantity: 5, skuMaster: SKU_ID },
          ],
        }),
      ],
      invoices: [
        invoice({
          items: [
            { itemCode: 'FG001', quantity: 5, unitRate: 100, skuMaster: SKU_ID },
            { itemCode: 'FG001', quantity: 5, unitRate: 100, skuMaster: SKU_ID },
          ],
        }),
      ],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.MATCHED);
    assert.equal(result.items[0].poQty, 10);
    assert.equal(result.items[0].grnQty, 10);
    assert.equal(result.items[0].invoiceQty, 10);
  });

  it('returns partially_matched when quantities are not fully reconciled without hard violations', () => {
    const result = computeMatch({
      purchaseOrders: [po({ items: [{ itemCode: 'FG001', quantity: 10, skuMaster: SKU_ID }] })],
      grns: [grn({ items: [{ itemCode: 'FG001', receivedQuantity: 8, skuMaster: SKU_ID }] })],
      invoices: [invoice({ items: [{ itemCode: 'FG001', quantity: 8, unitRate: 100, skuMaster: SKU_ID }] })],
      skuMasters: [sku()],
    });

    assert.equal(result.status, MATCH_STATUS.PARTIALLY_MATCHED);
  });
});

describe('masterResolver.normalizeCode', () => {
  it('trims and lowercases item codes', () => {
    assert.equal(normalizeCode('  ABC123  '), 'abc123');
  });
});
