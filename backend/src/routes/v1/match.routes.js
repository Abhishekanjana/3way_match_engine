import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as matchController from '../../controllers/match.controller.js';
import { poNumberParamSchema } from '../../validations/document.validation.js';

const router = express.Router();

/**
 * @openapi
 * /match/{poNumber}/audit:
 *   get:
 *     summary: Upload pipeline audit timeline for a PO number
 *     tags: [Match]
 *     parameters:
 *       - in: path
 *         name: poNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit steps (empty array if none)
 */
router.get(
  '/:poNumber/audit',
  auth,
  validate(poNumberParamSchema, 'params'),
  matchController.getAuditByPoNumber
);

/**
 * @openapi
 * /match/{poNumber}:
 *   get:
 *     summary: Recompute three-way match for a PO number
 *     tags: [Match]
 *     parameters:
 *       - in: path
 *         name: poNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match result
 */
router.get(
  '/:poNumber',
  auth,
  validate(poNumberParamSchema, 'params'),
  matchController.getByPoNumber
);

export default router;
