import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as skuController from '../../controllers/sku.controller.js';
import {
  createSkuSchema,
  updateSkuSchema,
  idParamSchema,
} from '../../validations/sku.validation.js';

const router = express.Router();

router.post('/', auth, validate(createSkuSchema), skuController.create);
router.get('/', auth, skuController.list);
router.get('/:id', auth, validate(idParamSchema, 'params'), skuController.getById);
router.patch('/:id', auth, validate(idParamSchema, 'params'), validate(updateSkuSchema), skuController.update);
router.delete('/:id', auth, validate(idParamSchema, 'params'), skuController.remove);

export default router;
