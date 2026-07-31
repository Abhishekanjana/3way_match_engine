import catchAsync from '../utils/catchAsync.js';
import * as skuService from '../services/sku.service.js';

const create = catchAsync(async (req, res) => {
  const sku = await skuService.createSku(req.body);
  res.status(201).json(sku);
});

const list = catchAsync(async (req, res) => {
  const skus = await skuService.listSkus();
  res.json(skus);
});

const getById = catchAsync(async (req, res) => {
  const sku = await skuService.getSkuById(req.params.id);
  res.json(sku);
});

const update = catchAsync(async (req, res) => {
  const sku = await skuService.updateSku(req.params.id, req.body);
  res.json(sku);
});

const remove = catchAsync(async (req, res) => {
  await skuService.deleteSku(req.params.id);
  res.status(204).send();
});

export { create, list, getById, update, remove };
