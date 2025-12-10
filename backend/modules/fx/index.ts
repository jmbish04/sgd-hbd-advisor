import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Env } from '../../index';
import { FxService } from './service';

const fxSchema = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'FX rate',
      content: {
        'application/json': {
          schema: z.object({
            rate: z.number(),
            source: z.string(),
          }),
        },
      },
    },
  },
});

export const fxApi = new OpenAPIHono<{ Bindings: Env }>();

fxApi.openapi(fxSchema, async (c) => {
  const service = new FxService(c.env.KV);
  const rate = await service.getRate();
  return c.json(rate);
});
