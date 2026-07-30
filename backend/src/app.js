const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/config');
const { successHandler, errorHandler: morganErrorHandler } = require('./config/morgan');
const { swaggerSpec } = require('./config/swagger');
const v1Routes = require('./routes/v1');
const { notFoundHandler, errorConverter, errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  if (config.env !== 'test') {
    app.use(successHandler);
    app.use(morganErrorHandler);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
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

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(v1Routes);

  app.use(notFoundHandler);
  app.use(errorConverter);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
