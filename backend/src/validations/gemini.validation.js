import Joi from 'joi';

const isoDateString = Joi.string().trim().required();

const poItemSchema = Joi.object({
  itemCode: Joi.string().trim().required(),
  description: Joi.string().trim().allow('').default(''),
  quantity: Joi.number().min(0).required(),
});

const grnItemSchema = Joi.object({
  itemCode: Joi.string().trim().required(),
  description: Joi.string().trim().allow('').default(''),
  receivedQuantity: Joi.number().min(0).required(),
  mrp: Joi.number().min(0).allow(null).optional(),
});

const invoiceItemSchema = Joi.object({
  itemCode: Joi.string().trim().required(),
  description: Joi.string().trim().allow('').default(''),
  quantity: Joi.number().min(0).required(),
  unitRate: Joi.number().min(0).allow(null).optional(),
  mrp: Joi.number().min(0).allow(null).optional(),
});

const PARSED_SCHEMAS = {
  po: Joi.object({
    poNumber: Joi.string().trim().required(),
    poDate: isoDateString,
    vendorName: Joi.string().trim().allow('').default(''),
    items: Joi.array().items(poItemSchema).min(1).required(),
  }),

  grn: Joi.object({
    grnNumber: Joi.string().trim().required(),
    poNumber: Joi.string().trim().required(),
    grnDate: isoDateString,
    items: Joi.array().items(grnItemSchema).min(1).required(),
  }),

  invoice: Joi.object({
    invoiceNumber: Joi.string().trim().required(),
    poNumber: Joi.string().trim().required(),
    invoiceDate: isoDateString,
    items: Joi.array().items(invoiceItemSchema).min(1).required(),
  }),
};

function validateParsedDocument(documentType, payload) {
  const schema = PARSED_SCHEMAS[documentType];

  if (!schema) {
    return { error: new Error(`Unknown document type: ${documentType}`) };
  }

  return schema.validate(payload, { abortEarly: false, stripUnknown: true });
}

export { validateParsedDocument, PARSED_SCHEMAS };
