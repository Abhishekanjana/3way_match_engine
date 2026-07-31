const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const matchController = require('../../controllers/match.controller');
const { poNumberParamSchema } = require('../../validations/document.validation');

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

module.exports = router;
