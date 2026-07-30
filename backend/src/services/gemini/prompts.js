const PROMPTS = {
  po: `You are extracting structured data from a Purchase Order (PO) document.

Extract ALL line items from every page of the document. Do not skip or merge rows.

Rules:
- itemCode must be the SKU/ERP/item code exactly as printed (string, preserve leading zeros).
- quantity is the ordered quantity (number).
- poDate and dates should be ISO 8601 strings (YYYY-MM-DD).
- If a field is missing, use empty string for text fields — never omit required keys.
- Do not invent line items that are not on the document.`,

  grn: `You are extracting structured data from a Goods Receipt Note (GRN) document.

Extract ALL line items from every page of the document. Do not skip or merge rows.

Rules:
- itemCode must be the SKU code exactly as printed (string, preserve leading zeros).
- receivedQuantity is the received qty column, not expected qty (number).
- mrp is lot MRP or unit MRP when visible (number or null).
- poNumber links this GRN to the purchase order.
- Dates should be ISO 8601 strings (YYYY-MM-DD).
- Do not invent line items that are not on the document.`,

  invoice: `You are extracting structured data from a vendor Tax Invoice document.

Extract ALL line items from every page of the document. Do not skip or merge rows.

Rules:
- itemCode must be the item/product code exactly as printed (string).
- quantity is invoiced quantity (number).
- unitRate is the unit rate/price before tax when visible (number or null).
- mrp is MRP when visible on the line (number or null).
- poNumber is the customer order / PO reference when present.
- Dates should be ISO 8601 strings (YYYY-MM-DD).
- Do not invent line items that are not on the document.`,
};

function getPrompt(documentType) {
  return PROMPTS[documentType];
}

module.exports = { getPrompt };
