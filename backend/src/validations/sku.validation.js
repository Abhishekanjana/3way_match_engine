const Joi = require('joi');

const createSkuSchema = Joi.object({
  skuErpCode: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  eanCode: Joi.string().trim().allow('', null).optional(),
  hsnCode: Joi.string().trim().allow('', null).optional(),
  uom: Joi.string().trim().allow('', null).optional(),
  agreedRate: Joi.number().min(0).required(),
  mrp: Joi.number().min(0).allow(null).optional(),
  priceTolerance: Joi.number().min(0).max(1).default(0.05),
  aliases: Joi.array().items(Joi.string().trim()).default([]),
});

const updateSkuSchema = createSkuSchema.fork(
  ['skuErpCode', 'name', 'agreedRate'],
  (schema) => schema.optional()
);

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

module.exports = { createSkuSchema, updateSkuSchema, idParamSchema };
