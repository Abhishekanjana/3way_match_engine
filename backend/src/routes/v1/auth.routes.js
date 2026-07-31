import express from 'express';
import * as authController from '../../controllers/auth.controller.js';

const router = express.Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Mock login — returns static bearer token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Token issued
 */
router.post('/login', authController.login);

export default router;
