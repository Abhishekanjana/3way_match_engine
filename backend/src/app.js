import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import config from './config/config.js';
import { successHandler, errorHandler as morganErrorHandler } from './config/morgan.js';
import { swaggerSpec } from './config/swagger.js';
import v1Routes from './routes/v1/index.js';
import { notFoundHandler, errorConverter, errorHandler } from './middlewares/errorHandler.js';
import { stripApiMountPrefix } from './middlewares/stripApiMountPrefix.js';

function createApp() {
  const app = express();

  // Vercel routes /api/backend/* to this service with the prefix intact.
  app.use(stripApiMountPrefix);

  if (config.env !== 'test') {
    app.use(successHandler);
    app.use(morganErrorHandler);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // Swagger UI needs inline scripts/styles; CSP blocks a blank white page.
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      exposedHeaders: ['Content-Disposition', 'Content-Type'],
    })
  );
  app.options('*', cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use(
    compression({
      filter: (req, res) => {
        if (req.path.endsWith('/file')) {
          return false;
        }

        return compression.filter(req, res);
      },
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: config.env });
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Three-Way Match Engine API',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(v1Routes);

  app.use(notFoundHandler);
  app.use(errorConverter);
  app.use(errorHandler);

  return app;
}

export { createApp };
