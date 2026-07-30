const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const matchController = require('../../controllers/match.controller');
const { poNumberParamSchema } = require('../../validations/document.validation');

const router = express.Router();

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
