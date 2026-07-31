const express = require('express');
const auth = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');
const validate = require('../../middlewares/validate');
const documentController = require('../../controllers/document.controller');
const {
  uploadSchema,
  listDocumentsSchema,
  idParamSchema,
  uploadJobIdParamSchema,
} = require('../../validations/document.validation');

const router = express.Router();

/**
 * @openapi
 * /documents/upload:
 *   post:
 *     summary: Upload and parse a PO, GRN, or Invoice document
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [po, grn, invoice]
 *     responses:
 *       201:
 *         description: Document stored
 */
router.post(
  '/upload',
  auth,
  upload.single('file'),
  validate(uploadSchema),
  documentController.upload
);

router.get(
  '/upload/jobs/:jobId',
  auth,
  validate(uploadJobIdParamSchema, 'params'),
  documentController.getUploadJob
);

router.get(
  '/po-numbers',
  auth,
  documentController.listPoNumbers
);

router.get(
  '/',
  auth,
  validate(listDocumentsSchema, 'query'),
  documentController.list
);

router.get(
  '/:id/file',
  auth,
  validate(idParamSchema, 'params'),
  documentController.getFile
);

router.get(
  '/:id',
  auth,
  validate(idParamSchema, 'params'),
  documentController.getById
);

module.exports = router;
