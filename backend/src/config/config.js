import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Joi from 'joi';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const BACKEND_ROOT = path.join(__dirname, '../..');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().required(),
  AUTH_TOKEN: Joi.string().default('dev-static-token-change-in-production'),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().default('gemini-3.5-flash-lite'),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  CLOUDINARY_FOLDER: Joi.string().default('three-way-match'),
  MAX_FILE_SIZE_MB: Joi.number().default(10),
  PUBLIC_API_URL: Joi.string().uri().allow('').optional(),
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
  cloudinary: {
    cloudName: String(envVars.CLOUDINARY_CLOUD_NAME).trim(),
    apiKey: String(envVars.CLOUDINARY_API_KEY).trim(),
    apiSecret: String(envVars.CLOUDINARY_API_SECRET).trim(),
    folder: String(envVars.CLOUDINARY_FOLDER).trim(),
  },
  upload: {
    maxFileSizeMb: envVars.MAX_FILE_SIZE_MB,
  },
  publicApiUrl: envVars.PUBLIC_API_URL || '',
  backendRoot: BACKEND_ROOT,
};

export default config;
