const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');

const successFormat = ':method :url :status - :response-time ms';

const successHandler = morgan(successFormat, {
  skip: (_req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(successFormat, {
  skip: (_req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.warn(message.trim()) },
});

module.exports = { successHandler, errorHandler };
