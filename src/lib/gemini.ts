// src/lib/gemini.ts

interface Env {
  GEMINI_API_KEY: string;
  // You might want to add these to your .dev.vars and secrets for dynamic URL construction
  // CLOUDFLARE_ACCOUNT_ID: string;
  // AI_GATEWAY_NAME: string;
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
}

/**
 * Calls the Gemini API through the Cloudflare AI Gateway.
 *
 * @param env - The worker environment containing the secrets.
 * @param model - The specific Gemini model to use (e.g., 'gemini-1.5-flash').
 * @param prompt - The user prompt to send to the model.
 * @returns The JSON response from the API.
 */
export async function callGeminiApi(env: Env, model: string, prompt: string) {
  // This URL is based on your curl command.
  // For production, it's better to build this dynamically using environment variables
  // for the account ID and gateway name.
  const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/b3304b14848de15c72c24a14b0cd187d/hdb-gateway/google-ai-studio/v1/models/${model}:generateContent`;

  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }

  const requestBody: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  const response = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
  }

  return response.json();
}