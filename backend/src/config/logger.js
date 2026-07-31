import winston from 'winston';
import config from './config.js';

const logger = winston.createLogger({
  level: config.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'three-way-match-api' },
  transports: [new winston.transports.Console()],
});

export default logger;
