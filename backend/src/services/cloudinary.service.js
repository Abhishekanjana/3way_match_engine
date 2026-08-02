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

function buildPublicId(documentType) {
  const stamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  return `${documentType}_${stamp}_${random}`;
}

function uploadBuffer(buffer, { mimeType, documentType }) {
  return new Promise((resolve, reject) => {
    // Keep upload params free of spaces/parentheses — those break Cloudinary signatures.
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${config.cloudinary.folder}/${documentType}`,
        public_id: buildPublicId(documentType),
        resource_type: mimeType === 'application/pdf' ? 'raw' : 'image',
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
