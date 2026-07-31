import mongoose from 'mongoose';
import logger from '../config/logger.js';
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js';

function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Route not found'));
}

function errorConverter(err, _req, _res, next) {
  if (err instanceof ApiError) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let code = 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';

  if (err.code === 11000 || err.code === 11001) {
    statusCode = 409;
    code = 'DUPLICATE_DOCUMENT';
    message = 'This document is already uploaded for the linked PO';
    logger.warn('MongoDB duplicate key error — check for stale unique indexes on invoices/grns', {
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
    });
  } else if (err instanceof mongoose.Error) {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    message = err.message || 'Invalid database operation';
  }

  return next(new ApiError(statusCode, code, message, false));
}

function errorHandler(err, _req, res, _next) {
  let { statusCode, code, message, isOperational } = err;

  if (config.isProduction && !isOperational) {
    statusCode = 500;
    code = 'INTERNAL_ERROR';
    message = 'An unexpected error occurred';
  }

  if (!isOperational) {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
  }

  res.status(statusCode || 500).json({
    error: { code: code || 'INTERNAL_ERROR', message },
  });
}

export { notFoundHandler, errorConverter, errorHandler };
