/**
 * Static OpenAPI 3 spec — do not rely on swagger-jsdoc file globs on Vercel
 * (serverless packaging leaves paths empty when scanning the filesystem).
 */
function buildOpenApiSpec({ port, publicApiUrl }) {
  const servers = [
    { url: '/', description: 'Current host' },
    { url: `http://localhost:${port}`, description: 'Local' },
  ];

  if (publicApiUrl) {
    servers.unshift({ url: publicApiUrl, description: 'Production' });
  }

  return {
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
    tags: [
      { name: 'Auth' },
      { name: 'Documents' },
      { name: 'Match' },
      { name: 'Summary' },
      { name: 'SKU Master' },
      { name: 'Health' },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['Health'],
          security: [],
          responses: {
            200: { description: 'Service is up' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Mock login — returns static bearer token',
          tags: ['Auth'],
          security: [],
          responses: {
            200: { description: 'Token issued' },
          },
        },
      },
      '/documents/upload': {
        post: {
          summary: 'Upload and parse a PO, GRN, or Invoice document',
          tags: ['Documents'],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'documentType'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    documentType: {
                      type: 'string',
                      enum: ['po', 'grn', 'invoice'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            202: { description: 'Upload job accepted — poll job status' },
          },
        },
      },
      '/documents/upload/jobs/{jobId}': {
        get: {
          summary: 'Poll upload job status',
          tags: ['Documents'],
          parameters: [
            {
              in: 'path',
              name: 'jobId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Job status' },
          },
        },
      },
      '/documents': {
        get: {
          summary: 'List documents',
          tags: ['Documents'],
          parameters: [
            {
              in: 'query',
              name: 'type',
              schema: { type: 'string', enum: ['po', 'grn', 'invoice'] },
            },
            {
              in: 'query',
              name: 'poNumber',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Document list' },
          },
        },
      },
      '/documents/po-numbers': {
        get: {
          summary: 'List known PO numbers',
          tags: ['Documents'],
          responses: {
            200: { description: 'PO number list' },
          },
        },
      },
      '/documents/{id}': {
        get: {
          summary: 'Get document by id',
          tags: ['Documents'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Document' },
          },
        },
      },
      '/documents/{id}/file': {
        get: {
          summary: 'Download or preview original file',
          tags: ['Documents'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'File bytes' },
          },
        },
      },
      '/match/{poNumber}': {
        get: {
          summary: 'Recompute three-way match for a PO number',
          tags: ['Match'],
          parameters: [
            {
              in: 'path',
              name: 'poNumber',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Match result' },
          },
        },
      },
      '/match/{poNumber}/audit': {
        get: {
          summary: 'Upload pipeline audit timeline for a PO number',
          tags: ['Match'],
          parameters: [
            {
              in: 'path',
              name: 'poNumber',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Audit steps' },
          },
        },
      },
      '/summary/{poNumber}': {
        get: {
          summary: 'Summary stat cards and cumulative table',
          tags: ['Summary'],
          parameters: [
            {
              in: 'path',
              name: 'poNumber',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Summary data' },
          },
        },
      },
      '/masters/sku': {
        get: {
          summary: 'List SKU masters',
          tags: ['SKU Master'],
          responses: {
            200: { description: 'SKU list' },
          },
        },
        post: {
          summary: 'Create SKU master',
          tags: ['SKU Master'],
          responses: {
            201: { description: 'Created' },
          },
        },
      },
      '/masters/sku/{id}': {
        get: {
          summary: 'Get SKU master by id',
          tags: ['SKU Master'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'SKU master' },
          },
        },
        patch: {
          summary: 'Update SKU master',
          tags: ['SKU Master'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Updated' },
          },
        },
        delete: {
          summary: 'Delete SKU master',
          tags: ['SKU Master'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            204: { description: 'Deleted' },
          },
        },
      },
    },
  };
}

export { buildOpenApiSpec };
