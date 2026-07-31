import swaggerJsdoc from 'swagger-jsdoc';
import config from './config.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Three-Way Match Engine API',
      version: '1.0.0',
      description: 'PO, GRN, and Invoice reconciliation API',
    },
    servers: [{ url: `http://localhost:${config.port}`, description: 'Local' }],
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
