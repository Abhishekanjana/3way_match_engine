import swaggerJsdoc from 'swagger-jsdoc';
import config from './config.js';

const servers = [
  { url: '/', description: 'Current host' },
  { url: `http://localhost:${config.port}`, description: 'Local' },
];

if (config.publicApiUrl) {
  servers.unshift({ url: config.publicApiUrl, description: 'Production' });
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Three-Way Match Engine API',
      version: '1.0.0',
      description: 'PO, GRN, and Invoice reconciliation API',
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [`${config.backendRoot}/src/routes/v1/*.js`],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerSpec };
