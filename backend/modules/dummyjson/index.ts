import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Env } from '../../index';
import { DummyJSONService } from './service';

const productsSchema = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'List of products',
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
});

export const productsApi = new OpenAPIHono<{ Bindings: Env }>();

productsApi.openapi(productsSchema, async (c) => {
  const service = new DummyJSONService();
  const products = await service.getProducts();
  return c.json(products);
});
