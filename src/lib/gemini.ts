import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * A generic environment interface that can be extended by consumers.
 * Ensures that the required GEMINI_API_KEY is available.
 */
interface Env {
  GEMINI_API_KEY: string;
}

/**
 * Initializes and returns a Gemini client configured to use the Cloudflare AI Gateway.
 *
 * This function encapsulates the SDK setup and ensures that all API calls
 * are routed through the specified gateway, leveraging its caching, logging,
 * and security features.
 *
 * @param env - The worker environment containing the `GEMINI_API_KEY` secret.
 * @returns An object containing a `getModel` function to get a configured generative model instance.
 */
export function getGeminiClient(env: Env) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }

  // Instantiate the official Google Generative AI SDK with the API key.
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  // This is the base URL for your Cloudflare AI Gateway endpoint.
  // The SDK will append the necessary paths for its API calls (e.g., /v1/models/gemini-1.5-flash:generateContent).
  const baseUrl = 'https://gateway.ai.cloudflare.com/v1/b3304b14848de15c72c24a14b0cd187d/hdb-gateway/google-ai-studio';

  /**
   * Returns a generative model instance from the SDK, with the `baseUrl`
   * pre-configured to point to the Cloudflare AI Gateway.
   * @param modelName - The name of the Gemini model to use (e.g., 'gemini-1.5-flash').
   * @returns A configured `GenerativeModel` instance.
   */
  const getModel = (modelName: string) => {
    return genAI.getGenerativeModel(
      { model: modelName },
      // This is the crucial step that routes SDK requests through the gateway.
      { baseUrl }
    );
  };

  return { getModel };
}
