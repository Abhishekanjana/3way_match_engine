const express = require('express');
const authController = require('../../controllers/auth.controller');

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

module.exports = router;
