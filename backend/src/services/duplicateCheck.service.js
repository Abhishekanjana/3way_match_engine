import PurchaseOrder from '../models/PurchaseOrder.js';
import Grn from '../models/Grn.js';
import Invoice from '../models/Invoice.js';
import { REASON_CODES } from '../utils/reasonCodes.js';

/**
 * Post-persistence duplicate detection.
 * Duplicates are stored (per assignment) and surfaced here + on GET /match.
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
        code: REASON_CODES.DUPLICATE_DOCUMENT,
        message: `Duplicate Invoice ${documentNumber} for ${poNumber}`,
      });
    }
  }

  return warnings;
}

export { checkDuplicates };
