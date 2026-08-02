import config from './config.js';
import { buildOpenApiSpec } from './openapi.spec.js';

const swaggerSpec = buildOpenApiSpec({
  port: config.port,
  publicApiUrl: config.publicApiUrl,
});

export { swaggerSpec };
