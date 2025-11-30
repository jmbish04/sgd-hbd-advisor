import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Env } from '../../index';
import { HealthService } from './service';

const healthSchema = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'Health check status',
      content: {
        'application/json': {
          schema: z.object({
            overallStatus: z.string(),
            checks: z.array(z.any()),
          }),
        },
      },
    },
    503: {
      description: 'Health check failed',
      content: {
        'application/json': {
          schema: z.object({
            overallStatus: z.string(),
            checks: z.array(z.any()),
          }),
        },
      },
    },
  },
});

export const healthApi = new OpenAPIHono<{ Bindings: Env }>();

healthApi.openapi(healthSchema, async (c) => {
  const service = new HealthService(c.env.DB);
  const checks = await service.getHealthChecks();
  const overallStatus = checks.every((check: any) => check.status === 'PASS') ? 'PASS' : 'FAIL';
  const httpStatus = overallStatus === 'PASS' ? 200 : 503;
  return c.json({ overallStatus, checks }, httpStatus);
});
