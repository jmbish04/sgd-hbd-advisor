import { GoogleGenerativeAI } from "@google/generative-ai";

interface Env {
  GOOGLE_AI_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
}

export function getGeminiClient(env: Env, model: string = "gemini-2.0-flash") {
  const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);

  // Configure AI Gateway URL
  const gatewayName = env.AI_GATEWAY_NAME || 'hdb-gateway';
  const baseUrl = 'https://gateway.ai.cloudflare.com/v1/b3304b14848de15c72c24a14b0cd187d/google-gemini-gateway/google-ai-studio';

  const generativeModel = genAI.getGenerativeModel(
    { model },
    { baseUrl }
  );

  return { ai: generativeModel, model };
}
