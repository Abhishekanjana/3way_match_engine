const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const summaryController = require('../../controllers/summary.controller');
const { poNumberParamSchema } = require('../../validations/document.validation');

const router = express.Router();

/**
 * @openapi
 * /summary/{poNumber}:
 *   get:
 *     summary: Summary stat cards and cumulative table
 *     tags: [Summary]
 *     parameters:
 *       - in: path
 *         name: poNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary data
 */
router.get(
  '/:poNumber',
  auth,
  validate(poNumberParamSchema, 'params'),
  summaryController.getByPoNumber
);

module.exports = router;
