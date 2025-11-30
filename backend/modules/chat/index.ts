import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { getGeminiClient } from '../../lib/gemini';
import { Env } from '../../index'; // Import the unified Env type

const chatSchema = createRoute({
  method: 'post',
  path: '/',
  operationId: 'postChat',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            messages: z.array(z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string(),
            })),
            model: z.string().optional().default('gemini-1.5-flash'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'AI chat response',
      content: {
        'application/json': {
          schema: z.object({
            role: z.string(),
            content: z.string(),
          }),
        },
      },
    },
    500: {
      description: 'Error response',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    }
  },
});

export const chatApi = new OpenAPIHono<{ Bindings: Env }>();

chatApi.openapi(chatSchema, async (c) => {
  const { messages, model: modelName } = await c.req.json();

  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

  if (!lastUserMessage) {
    return c.json({ error: 'No user message found' }, 400);
  }

  try {
    const { getModel } = getGeminiClient(c.env);
    const model = getModel(modelName);
    const result = await model.generateContent(lastUserMessage.content);
    const responseText = result.response.text();

    return c.json({
      role: 'assistant',
      content: responseText,
    });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return c.json({ error: `Failed to get response from AI: ${errorMessage}` }, 500);
  }
});
