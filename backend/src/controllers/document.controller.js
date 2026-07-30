const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const documentService = require('../services/document.service');
const uploadJobService = require('../services/uploadJob.service');

const upload = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'File is required');
  }

  const job = await uploadJobService.createJob(req.file, req.body.documentType);
  uploadJobService.processJobAsync(job._id);

  res.status(202).json({
    jobId: String(job._id),
    status: job.status,
    step: job.step,
  });
});

const getUploadJob = catchAsync(async (req, res) => {
  const status = await uploadJobService.getJobStatus(req.params.jobId);
  res.json(status);
});

const getById = catchAsync(async (req, res) => {
  const doc = await documentService.getDocumentById(req.params.id);
  res.json(doc);
});

const list = catchAsync(async (req, res) => {
  const docs = await documentService.listDocuments(req.query);
  res.json(docs);
});

const getFile = catchAsync(async (req, res) => {
  const { absolutePath, mimeType, originalFileName } = await documentService.getDocumentFile(
    req.params.id
  );

  const isPreview = req.get('X-Document-Preview') === '1';

  if (isPreview) {
    // PDFs are served as octet-stream so download managers (e.g. IDM) do not intercept preview.
    if (mimeType?.startsWith('image/')) {
      res.setHeader('Content-Type', mimeType);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    res.setHeader('Cache-Control', 'private, no-store');
  } else {
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(originalFileName)}"`
    );
  }

  res.sendFile(absolutePath);
});

module.exports = { upload, getUploadJob, getById, list, getFile };
