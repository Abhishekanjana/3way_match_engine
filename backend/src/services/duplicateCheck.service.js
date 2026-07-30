const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const ApiError = require('../utils/ApiError');
const { REASON_CODES } = require('../utils/reasonCodes');

async function assertNotDuplicate(documentType, poNumber, documentNumber) {
  if (documentType === 'po') {
    const existing = await PurchaseOrder.findOne({ poNumber });
    if (existing) {
      throw new ApiError(
        409,
        'DUPLICATE_DOCUMENT',
        `PO ${poNumber} is already uploaded`
      );
    }
    return;
  }

  if (documentType === 'grn') {
    const existing = await Grn.findOne({ poNumber, grnNumber: documentNumber });
    if (existing) {
      throw new ApiError(
        409,
        'DUPLICATE_DOCUMENT',
        `GRN ${documentNumber} is already uploaded for PO ${poNumber}`
      );
    }
    return;
  }

  if (documentType === 'invoice') {
    const existing = await Invoice.findOne({ poNumber, invoiceNumber: documentNumber });
    if (existing) {
      throw new ApiError(
        409,
        'DUPLICATE_DOCUMENT',
        `Invoice ${documentNumber} is already uploaded for PO ${poNumber}`
      );
    }
  }
}

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

module.exports = { assertNotDuplicate, checkDuplicates };
