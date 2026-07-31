import morgan from 'morgan';
import config from './config.js';
import logger from './logger.js';

const successFormat = ':method :url :status - :response-time ms';

const successHandler = morgan(successFormat, {
  skip: (_req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(successFormat, {
  skip: (_req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.warn(message.trim()) },
});

export { successHandler, errorHandler };
