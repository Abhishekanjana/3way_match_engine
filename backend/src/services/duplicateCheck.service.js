import PurchaseOrder from '../models/PurchaseOrder.js';
import Grn from '../models/Grn.js';
import Invoice from '../models/Invoice.js';
import { REASON_CODES } from '../utils/reasonCodes.js';

/**
 * Post-persistence duplicate detection.
 * PO/GRN duplicates are stored and surfaced as conflicts.
 * Invoice re-uploads are stored for audit but not double-counted in match.
 */
async function checkDuplicates(documentType, poNumber, documentNumber) {
  const warnings = [];

  if (documentType === 'po') {
    const count = await PurchaseOrder.countDocuments({ poNumber });
    if (count > 1) {
      warnings.push({ code: REASON_CODES.DUPLICATE_PO, message: `Duplicate PO for ${poNumber}` });
    }
    return warnings;
  }

  if (documentType === 'grn') {
    const count = await Grn.countDocuments({ poNumber, grnNumber: documentNumber });
    if (count > 1) {
      warnings.push({
        code: REASON_CODES.DUPLICATE_DOCUMENT,
        message: `Duplicate GRN ${documentNumber} for ${poNumber}`,
      });
    }
    return warnings;
  }

  if (documentType === 'invoice') {
    const count = await Invoice.countDocuments({ poNumber, invoiceNumber: documentNumber });
    if (count > 1) {
      warnings.push({
        code: REASON_CODES.DUPLICATE_INVOICE_IGNORED,
        message: `Invoice ${documentNumber} already exists for ${poNumber}; stored for audit but not double-counted`,
      });
    }
  }

  return warnings;
}

export { checkDuplicates };
