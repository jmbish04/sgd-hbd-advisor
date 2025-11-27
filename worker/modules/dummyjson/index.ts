import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { fetchProducts } from './service'

const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number(),
  discountPercentage: z.number().optional(),
  rating: z.number().optional(),
  stock: z.number(),
  brand: z.string().optional(),
  category: z.string().optional(),
  thumbnail: z.string().optional(),
  images: z.array(z.string()).optional(),
})

const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number().optional(),
  skip: z.number().optional(),
  limit: z.number().optional(),
})

const productsSchema = createRoute({
  method: 'get',
  path: '/',
  operationId: 'getProducts',
  responses: {
    200: {
      description: 'A list of products from DummyJSON',
      content: {
        'application/json': {
          schema: ProductsResponseSchema
        }
      },
    },
  },
})

export const productsApi = new OpenAPIHono()

productsApi.openapi(productsSchema, async (c) => {
  const data = await fetchProducts()
  return c.json(data)
})
