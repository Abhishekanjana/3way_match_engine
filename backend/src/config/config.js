const path = require('path');
const Joi = require('joi');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BACKEND_ROOT = path.join(__dirname, '../..');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().required(),
  AUTH_TOKEN: Joi.string().default('dev-static-token-change-in-production'),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().default('gemini-3.5-flash-lite'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  MAX_FILE_SIZE_MB: Joi.number().default(10),
}).unknown();

const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  throw new Error(`Config validation error: ${error.details.map((d) => d.message).join(', ')}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  isProduction: envVars.NODE_ENV === 'production',
  mongoose: {
    url: envVars.MONGODB_URI,
  },
  authToken: envVars.AUTH_TOKEN,
  gemini: {
    apiKey: envVars.GEMINI_API_KEY || '',
    model: envVars.GEMINI_MODEL,
  },
  upload: {
    dir: path.isAbsolute(envVars.UPLOAD_DIR)
      ? envVars.UPLOAD_DIR
      : path.join(BACKEND_ROOT, envVars.UPLOAD_DIR),
    maxFileSizeMb: envVars.MAX_FILE_SIZE_MB,
  },
  backendRoot: BACKEND_ROOT,
};

module.exports = config;
