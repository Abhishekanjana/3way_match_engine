import path from 'node:path';
import fs from 'node:fs';
import logger from '../config/logger.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Grn from '../models/Grn.js';
import Invoice from '../models/Invoice.js';
import MatchAudit from '../models/MatchAudit.js';
import ApiError from '../utils/ApiError.js';
import { parseDocumentDate } from '../utils/date.js';
import { parseDocument } from './gemini.service.js';
import { resolveItems } from './masterResolver.service.js';
import { checkDuplicates } from './duplicateCheck.service.js';
import { getMatchSummaryByPoNumber } from './match.service.js';
import { REASON_CODES } from '../utils/reasonCodes.js';

const MODELS_BY_TYPE = {
  po: PurchaseOrder,
  grn: Grn,
  invoice: Invoice,
};

async function appendAuditStep(poNumber, step, status, message) {
  await MatchAudit.findOneAndUpdate(
    { poNumber },
    {
      $push: {
        steps: { step, status, message, at: new Date() },
      },
    },
    { upsert: true, new: true }
  );
}

function buildPersistPayload(documentType, parsed, file, rawParsed) {
  const base = {
    rawParsed,
    filePath: file.path,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
  };

  if (documentType === 'po') {
    return {
      ...base,
      poNumber: parsed.poNumber.trim(),
      poDate: parseDocumentDate(parsed.poDate),
      vendorName: parsed.vendorName || '',
      items: parsed.items.map((item) => ({
        itemCode: String(item.itemCode).trim(),
        description: item.description || '',
        quantity: item.quantity,
        skuMaster: null,
      })),
    };
  }

  if (documentType === 'grn') {
    const grnDate = parseDocumentDate(parsed.grnDate);
    if (!grnDate) {
      throw new ApiError(400, 'PARSE_VALIDATION_ERROR', 'GRN date is missing or invalid');
    }

    return {
      ...base,
      grnNumber: String(parsed.grnNumber).trim(),
      poNumber: String(parsed.poNumber).trim(),
      grnDate,
      items: parsed.items.map((item) => ({
        itemCode: String(item.itemCode).trim(),
        description: item.description || '',
        receivedQuantity: item.receivedQuantity,
        mrp: item.mrp ?? null,
        skuMaster: null,
      })),
    };
  }

  return {
    ...base,
    invoiceNumber: parsed.invoiceNumber.trim(),
    poNumber: parsed.poNumber.trim(),
    invoiceDate: parseDocumentDate(parsed.invoiceDate),
    items: parsed.items.map((item) => ({
      itemCode: String(item.itemCode).trim(),
      description: item.description || '',
      quantity: item.quantity,
      unitRate: item.unitRate ?? null,
      mrp: item.mrp ?? null,
      skuMaster: null,
    })),
  };
}

function getPoNumberFromPayload(documentType, payload) {
  return documentType === 'po' ? payload.poNumber : payload.poNumber;
}

function getDocumentNumber(documentType, payload) {
  if (documentType === 'po') {
    return payload.poNumber;
  }

  if (documentType === 'grn') {
    return payload.grnNumber;
  }

  return payload.invoiceNumber;
}

async function persistDocument(documentType, payload) {
  const Model = MODELS_BY_TYPE[documentType];
  return Model.create(payload);
}

function shapeDocumentResponse(document, documentType) {
  const json = document.toObject();

  return {
    ...json,
    documentType,
    id: String(json._id),
  };
}

async function uploadDocument(file, documentType, options = {}) {
  const { onPhase } = options;
  const setPhase = (status, step) => onPhase?.({ status, step });

  let poNumber;

  try {
    setPhase('parsing', 'Parsing document with AI…');
    await appendAuditStep('pending', 'parse', 'started', `Parsing ${documentType} upload`);

    const { parsed, rawParsed } = await parseDocument(file, documentType);
    const payload = buildPersistPayload(documentType, parsed, file, rawParsed);
    poNumber = getPoNumberFromPayload(documentType, payload);

    await appendAuditStep(poNumber, 'parse', 'success', 'Document parsed successfully');

    setPhase('resolving', 'Mapping line items to SKU master…');
    payload.items = await resolveItems(payload.items);
    await appendAuditStep(poNumber, 'resolve_masters', 'success', 'SKU master resolution complete');

    setPhase('saving', 'Saving document and updating match…');
    const document = await persistDocument(documentType, payload);
    await appendAuditStep(poNumber, 'persist', 'success', `Stored ${documentType} document`);

    const documentNumber = getDocumentNumber(documentType, payload);
    const duplicateWarnings = await checkDuplicates(documentType, poNumber, documentNumber);

    if (duplicateWarnings.length > 0) {
      await appendAuditStep(
        poNumber,
        'duplicate_check',
        'warning',
        duplicateWarnings.map((warning) => warning.message).join('; ')
      );
    } else {
      await appendAuditStep(poNumber, 'duplicate_check', 'success', 'No duplicate conflicts');
    }

    setPhase('matching', 'Computing match status…');
    const { status: matchStatus, reasons: matchReasons } = await getMatchSummaryByPoNumber(poNumber);
    await appendAuditStep(poNumber, 'match', 'success', `Match status: ${matchStatus}`);

    const duplicateIgnored = duplicateWarnings.some(
      (warning) => warning.code === REASON_CODES.DUPLICATE_INVOICE_IGNORED
    );

    return {
      documentId: String(document._id),
      documentType,
      poNumber,
      duplicateWarnings,
      duplicateIgnored,
      matchStatus,
      matchReasons,
      document: shapeDocumentResponse(document, documentType),
    };
  } catch (error) {
    if (poNumber) {
      try {
        await appendAuditStep(poNumber, 'upload', 'failed', error.message);
      } catch (auditError) {
        logger.warn('Failed to write upload audit step', { message: auditError.message });
      }
    }

    throw error;
  }
}

async function findDocumentRecordById(id) {
  const populate = { path: 'items.skuMaster', select: 'skuErpCode name eanCode hsnCode uom agreedRate mrp priceTolerance' };

  const po = await PurchaseOrder.findById(id).populate(populate);
  if (po) {
    return { document: po, documentType: 'po' };
  }

  const grn = await Grn.findById(id).populate(populate);
  if (grn) {
    return { document: grn, documentType: 'grn' };
  }

  const invoice = await Invoice.findById(id).populate(populate);
  if (invoice) {
    return { document: invoice, documentType: 'invoice' };
  }

  return null;
}

async function getDocumentById(id) {
  const result = await findDocumentRecordById(id);

  if (!result) {
    throw new ApiError(404, 'NOT_FOUND', 'Document not found');
  }

  return shapeDocumentResponse(result.document, result.documentType);
}

async function getDocumentFile(id) {
  const result = await findDocumentRecordById(id);

  if (!result) {
    throw new ApiError(404, 'NOT_FOUND', 'Document not found');
  }

  const { document } = result;
  const absolutePath = path.resolve(document.filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new ApiError(404, 'NOT_FOUND', 'Original file not found on disk');
  }

  return {
    absolutePath,
    mimeType: document.mimeType,
    originalFileName: document.originalFileName,
  };
}

async function listDocuments(filters = {}) {
  const { type, poNumber } = filters;
  const results = [];
  const projection = '-rawParsed -filePath -mimeType -originalFileName';

  const shouldInclude = (docType) => !type || type === docType;

  if (shouldInclude('po')) {
    const query = poNumber ? { poNumber } : {};
    const docs = await PurchaseOrder.find(query).select(projection).sort({ createdAt: -1 }).lean();
    results.push(...docs.map((doc) => ({ ...doc, documentType: 'po', id: String(doc._id) })));
  }

  if (shouldInclude('grn')) {
    const query = poNumber ? { poNumber } : {};
    const docs = await Grn.find(query).select(projection).sort({ createdAt: -1 }).lean();
    results.push(...docs.map((doc) => ({ ...doc, documentType: 'grn', id: String(doc._id) })));
  }

  if (shouldInclude('invoice')) {
    const query = poNumber ? { poNumber } : {};
    const docs = await Invoice.find(query).select(projection).sort({ createdAt: -1 }).lean();
    results.push(
      ...docs.map((doc) => ({ ...doc, documentType: 'invoice', id: String(doc._id) }))
    );
  }

  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function listPoNumbers() {
  const [fromPo, fromGrn, fromInvoice] = await Promise.all([
    PurchaseOrder.distinct('poNumber'),
    Grn.distinct('poNumber'),
    Invoice.distinct('poNumber'),
  ]);

  return [...new Set([...fromPo, ...fromGrn, ...fromInvoice])].sort();
}

export {
  uploadDocument,
  getDocumentById,
  getDocumentFile,
  listDocuments,
  listPoNumbers,
};
