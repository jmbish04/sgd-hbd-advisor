import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Environment interface defining the necessary secrets for the Gemini client.
 */
interface Env {
  GEMINI_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  AI_GATEWAY_NAME: string;
}

/**
 * Initializes and returns a Gemini client configured to use the Cloudflare AI Gateway.
 *
 * This function encapsulates the SDK setup and ensures that all API calls
 * are routed through the specified gateway.
 *
 * @param env - The worker environment containing the necessary secrets.
 * @returns An object containing a `getModel` function to get a configured generative model instance.
 */
export function getGeminiClient(env: Env) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }
  if (!env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is not defined in the environment.");
  }
  if (!env.AI_GATEWAY_NAME) {
    throw new Error("AI_GATEWAY_NAME is not defined in the environment.");
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  // Correctly construct the baseUrl WITHOUT the API version.
  // The SDK will append the version path (e.g., /v1beta) itself.
  const baseUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.AI_GATEWAY_NAME}/google-ai-studio`;

  /**
   * Returns a generative model instance from the SDK, with the `baseUrl`
   * pre-configured to point to the Cloudflare AI Gateway.
   * @param modelName - The name of the Gemini model to use (e.g., 'gemini-1.5-flash').
   * @returns A configured `GenerativeModel` instance.
   */
  const getModel = (modelName: string) => {
    return genAI.getGenerativeModel(
      { model: modelName },
      { baseUrl }
    );
  };

  return { getModel };
}