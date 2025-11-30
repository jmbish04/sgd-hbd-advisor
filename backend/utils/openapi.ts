import { OpenAPIHono } from '@hono/zod-openapi'

export function createOpenApiSpec(app: OpenAPIHono) {
  // Hono automatically aggregates routes registered with `.openapi()`
  // We just need to define the top-level info.
  return app.getOpenAPIDocument({
    openapi: '3.1.0',
    info: {
      title: 'Gold Standard Worker API',
      version: '1.0.0',
      description: 'A modular, multi-protocol API for the Gold Standard template.',
    },
    servers: [{ url: '/api', description: 'API' }],
  })
}
