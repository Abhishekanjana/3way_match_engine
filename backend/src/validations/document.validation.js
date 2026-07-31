import Joi from 'joi';

const loginSchema = Joi.object({
  username: Joi.string().optional(),
  password: Joi.string().optional(),
});

const uploadSchema = Joi.object({
  documentType: Joi.string().valid('po', 'grn', 'invoice').required(),
});

const listDocumentsSchema = Joi.object({
  type: Joi.string().valid('po', 'grn', 'invoice').optional(),
  poNumber: Joi.string().trim().optional(),
});

const poNumberParamSchema = Joi.object({
  poNumber: Joi.string().trim().required(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const uploadJobIdParamSchema = Joi.object({
  jobId: Joi.string().hex().length(24).required(),
});

export {
  loginSchema,
  uploadSchema,
  listDocumentsSchema,
  poNumberParamSchema,
  idParamSchema,
  uploadJobIdParamSchema,
};
