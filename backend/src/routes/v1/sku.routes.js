const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const skuController = require('../../controllers/sku.controller');
const {
  createSkuSchema,
  updateSkuSchema,
  idParamSchema,
} = require('../../validations/sku.validation');

const router = express.Router();

router.post('/', auth, validate(createSkuSchema), skuController.create);
router.get('/', auth, skuController.list);
router.get('/:id', auth, validate(idParamSchema, 'params'), skuController.getById);
router.patch('/:id', auth, validate(idParamSchema, 'params'), validate(updateSkuSchema), skuController.update);
router.delete('/:id', auth, validate(idParamSchema, 'params'), skuController.remove);

module.exports = router;
