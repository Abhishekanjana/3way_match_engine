import config from './config.js';

function resolveSwaggerBasePath(originalUrl = '') {
  const path = originalUrl.split('?')[0];
  const docsIndex = path.indexOf('/api-docs');

  if (docsIndex <= 0) {
    return '';
  }

  return path.slice(0, docsIndex);
}

function buildSwaggerHtml(specUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Three-Way Match Engine API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: ${JSON.stringify(specUrl)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`;
}

function resolveSpecUrl(req) {
  if (config.publicApiUrl) {
    return `${config.publicApiUrl.replace(/\/$/, '')}/api-docs.json`;
  }

  const basePath = resolveSwaggerBasePath(req.originalUrl);
  return `${basePath}/api-docs.json`;
}

function renderSwaggerUi(req, res) {
  const specUrl = resolveSpecUrl(req);

  res.type('html').send(buildSwaggerHtml(specUrl));
}

export { renderSwaggerUi, resolveSwaggerBasePath, resolveSpecUrl, buildSwaggerHtml };
