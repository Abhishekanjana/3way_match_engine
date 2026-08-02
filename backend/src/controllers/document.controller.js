import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as documentService from '../services/document.service.js';
import * as uploadJobService from '../services/uploadJob.service.js';

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

const listPoNumbers = catchAsync(async (_req, res) => {
  const poNumbers = await documentService.listPoNumbers();
  res.json(poNumbers);
});

const getFile = catchAsync(async (req, res) => {
  const fileData = await documentService.getDocumentFile(req.params.id);
  const { mimeType, originalFileName } = fileData;

  const isPreview = req.get('X-Document-Preview') === '1';

  if (isPreview) {
    if (mimeType?.startsWith('image/')) {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'inline');
    } else if (mimeType?.includes('pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    } else {
      // Fallback for download-manager bypass; client maps octet-stream to PDF for preview.
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

  if (fileData.buffer) {
    res.send(fileData.buffer);
    return;
  }

  res.sendFile(fileData.absolutePath);
});

export { upload, getUploadJob, getById, list, listPoNumbers, getFile };
