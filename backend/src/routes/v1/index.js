const express = require('express');
const authRoutes = require('./auth.routes');
const documentRoutes = require('./document.routes');
const matchRoutes = require('./match.routes');
const summaryRoutes = require('./summary.routes');
const skuRoutes = require('./sku.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/match', matchRoutes);
router.use('/summary', summaryRoutes);
router.use('/masters/sku', skuRoutes);

module.exports = router;
