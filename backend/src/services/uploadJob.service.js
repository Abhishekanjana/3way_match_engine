import logger from '../config/logger.js';
import UploadJob from '../models/UploadJob.js';
import ApiError from '../utils/ApiError.js';
import * as documentService from './document.service.js';

async function updateJob(jobId, patch) {
  return UploadJob.findByIdAndUpdate(jobId, patch, { new: true });
}

async function createJob(file, documentType) {
  return UploadJob.create({
    status: 'queued',
    step: 'Upload received',
    documentType,
    filePath: file.path,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
  });
}

async function getJob(jobId) {
  return UploadJob.findById(jobId).lean();
}

async function processJob(jobId) {
  const job = await UploadJob.findById(jobId);

  if (!job || job.status === 'completed' || job.status === 'failed') {
    return;
  }

  const file = {
    path: job.filePath,
    originalname: job.originalFileName,
    mimetype: job.mimeType,
  };

  try {
    const result = await documentService.uploadDocument(file, job.documentType, {
      onPhase: ({ status, step }) => updateJob(jobId, { status, step }),
    });

    const matchLabel = result.matchStatus
      ? result.matchStatus.replace(/_/g, ' ')
      : 'complete';

    await updateJob(jobId, {
      status: 'completed',
      step: `Match: ${matchLabel}`,
      result,
      error: undefined,
    });
  } catch (error) {
    const message = error.message || 'Upload failed';
    const code =
      error instanceof ApiError
        ? error.code
        : typeof error.code === 'string'
          ? error.code
          : 'UPLOAD_FAILED';

    logger.warn('Upload job failed', { jobId: String(jobId), code, message });

    await updateJob(jobId, {
      status: 'failed',
      step: 'Upload failed',
      error: { code, message },
    });
  }
}

function processJobAsync(jobId) {
  setImmediate(() => {
    processJob(jobId).catch((error) => {
      logger.error('Unhandled upload job error', {
        jobId: String(jobId),
        message: error.message,
        stack: error.stack,
      });
    });
  });
}

async function getJobStatus(jobId) {
  const job = await getJob(jobId);

  if (!job) {
    throw new ApiError(404, 'NOT_FOUND', 'Upload job not found');
  }

  return {
    jobId: String(job._id),
    status: job.status,
    step: job.step,
    result: job.status === 'completed' ? job.result : undefined,
    error: job.status === 'failed' ? job.error : undefined,
  };
}

export {
  createJob,
  getJobStatus,
  processJobAsync,
};
