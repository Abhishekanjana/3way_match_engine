import fs from 'node:fs/promises';
import logger from '../config/logger.js';
import UploadJob from '../models/UploadJob.js';
import ApiError from '../utils/ApiError.js';
import * as documentService from './document.service.js';
import {
  downloadToTempFile,
  isRemoteFileUrl,
  uploadDocumentFile,
} from './cloudinary.service.js';

async function updateJob(jobId, patch) {
  return UploadJob.findByIdAndUpdate(jobId, patch, { new: true });
}

async function createJob(file, documentType) {
  const { secureUrl } = await uploadDocumentFile(file, documentType);

  return UploadJob.create({
    status: 'queued',
    step: 'Upload received',
    documentType,
    filePath: secureUrl,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
  });
}

async function getJob(jobId) {
  return UploadJob.findById(jobId).lean();
}

async function materializeJobFile(job) {
  if (isRemoteFileUrl(job.filePath)) {
    return downloadToTempFile(job.filePath, job.mimeType, job.originalFileName);
  }

  return job.filePath;
}

async function processJob(jobId) {
  const job = await UploadJob.findById(jobId);

  if (!job || job.status === 'completed' || job.status === 'failed') {
    return;
  }

  let tempPath;
  const shouldCleanupTemp = isRemoteFileUrl(job.filePath);

  try {
    tempPath = await materializeJobFile(job);

    const file = {
      path: tempPath,
      originalname: job.originalFileName,
      mimetype: job.mimeType,
      storageUrl: job.filePath,
    };

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
  } finally {
    if (tempPath && shouldCleanupTemp) {
      await fs.unlink(tempPath).catch(() => {});
    }
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
