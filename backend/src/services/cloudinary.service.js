import { Readable } from 'node:stream';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

function isRemoteFileUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function sanitizeFileName(originalName) {
  const baseName = path.basename(originalName || 'document');
  return baseName.replace(/[^\w.\-() ]+/g, '_');
}

function uploadBuffer(buffer, { originalName, mimeType, documentType }) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${config.cloudinary.folder}/${documentType}`,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        filename_override: sanitizeFileName(originalName),
        context: {
          original_file_name: originalName || '',
          mime_type: mimeType || '',
        },
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

async function uploadDocumentFile(file, documentType) {
  if (!file?.buffer) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Upload buffer is missing');
  }

  try {
    const result = await uploadBuffer(file.buffer, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      documentType,
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new ApiError(
      502,
      'CLOUDINARY_UPLOAD_FAILED',
      error.message || 'Failed to upload file to Cloudinary'
    );
  }
}

async function fetchFileBuffer(fileUrl) {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new ApiError(404, 'NOT_FOUND', 'Original file not found in Cloudinary');
  }

  return Buffer.from(await response.arrayBuffer());
}

async function downloadToTempFile(fileUrl, mimeType, originalName) {
  const buffer = await fetchFileBuffer(fileUrl);
  const extension = path.extname(originalName || '') || guessExtension(mimeType);
  const tempPath = path.join(
    os.tmpdir(),
    `twm-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
  );

  await fs.writeFile(tempPath, buffer);
  return tempPath;
}

function guessExtension(mimeType) {
  if (mimeType === 'application/pdf') {
    return '.pdf';
  }

  if (mimeType === 'image/jpeg') {
    return '.jpg';
  }

  if (mimeType === 'image/png') {
    return '.png';
  }

  return '';
}

export {
  isRemoteFileUrl,
  uploadDocumentFile,
  fetchFileBuffer,
  downloadToTempFile,
};
