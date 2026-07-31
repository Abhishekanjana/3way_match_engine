import express from 'express';
import authRoutes from './auth.routes.js';
import documentRoutes from './document.routes.js';
import matchRoutes from './match.routes.js';
import summaryRoutes from './summary.routes.js';
import skuRoutes from './sku.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/match', matchRoutes);
router.use('/summary', summaryRoutes);
router.use('/masters/sku', skuRoutes);

export default router;
