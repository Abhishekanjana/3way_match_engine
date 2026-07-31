import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as summaryController from '../../controllers/summary.controller.js';
import { poNumberParamSchema } from '../../validations/document.validation.js';

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

export default router;
