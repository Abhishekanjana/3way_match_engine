const ITEM_PROPERTIES = {
  itemCode: { type: 'STRING', description: 'SKU or ERP item code as printed on the document' },
  description: { type: 'STRING', description: 'Line item description' },
};

const RESPONSE_SCHEMAS = {
  po: {
    type: 'OBJECT',
    properties: {
      poNumber: { type: 'STRING' },
      poDate: { type: 'STRING', description: 'ISO date YYYY-MM-DD' },
      vendorName: { type: 'STRING' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            ...ITEM_PROPERTIES,
            quantity: { type: 'NUMBER' },
          },
          required: ['itemCode', 'description', 'quantity'],
          propertyOrdering: ['itemCode', 'description', 'quantity'],
        },
      },
    },
    required: ['poNumber', 'poDate', 'vendorName', 'items'],
    propertyOrdering: ['poNumber', 'poDate', 'vendorName', 'items'],
  },

  grn: {
    type: 'OBJECT',
    properties: {
      grnNumber: { type: 'STRING' },
      poNumber: { type: 'STRING' },
      grnDate: { type: 'STRING', description: 'ISO date YYYY-MM-DD' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            ...ITEM_PROPERTIES,
            receivedQuantity: { type: 'NUMBER' },
            mrp: { type: 'NUMBER', nullable: true },
          },
          required: ['itemCode', 'description', 'receivedQuantity'],
          propertyOrdering: ['itemCode', 'description', 'receivedQuantity', 'mrp'],
        },
      },
    },
    required: ['grnNumber', 'poNumber', 'grnDate', 'items'],
    propertyOrdering: ['grnNumber', 'poNumber', 'grnDate', 'items'],
  },

  invoice: {
    type: 'OBJECT',
    properties: {
      invoiceNumber: { type: 'STRING' },
      poNumber: { type: 'STRING' },
      invoiceDate: { type: 'STRING', description: 'ISO date YYYY-MM-DD' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            ...ITEM_PROPERTIES,
            quantity: { type: 'NUMBER' },
            unitRate: { type: 'NUMBER', nullable: true },
            mrp: { type: 'NUMBER', nullable: true },
          },
          required: ['itemCode', 'description', 'quantity'],
          propertyOrdering: ['itemCode', 'description', 'quantity', 'unitRate', 'mrp'],
        },
      },
    },
    required: ['invoiceNumber', 'poNumber', 'invoiceDate', 'items'],
    propertyOrdering: ['invoiceNumber', 'poNumber', 'invoiceDate', 'items'],
  },
};

function getResponseSchema(documentType) {
  return RESPONSE_SCHEMAS[documentType];
}

export { getResponseSchema };
