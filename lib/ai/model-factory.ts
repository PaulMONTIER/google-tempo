import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { StructuredToolInterface } from "@langchain/core/tools";

/**
 * Options pour la création d'un modèle Gemini
 */
export interface GeminiModelOptions {
  modelName?: string;
  temperature?: number;
  apiKey?: string;
}

/**
 * Crée un modèle Gemini configuré avec les options par défaut
 * @param options Options de configuration du modèle
 * @returns Instance du modèle ChatGoogleGenerativeAI
 */
export function createGeminiModel(options?: GeminiModelOptions): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    modelName: options?.modelName || "gemini-2.5-flash",
    temperature: options?.temperature ?? 0,
    apiKey: options?.apiKey || process.env.GOOGLE_API_KEY,
  });
}

/**
 * Crée un modèle Gemini configuré avec des outils (tools)
 * @param tools Liste des outils à lier au modèle
 * @param options Options de configuration du modèle
 * @returns Instance du modèle ChatGoogleGenerativeAI avec outils liés
 */
export function createGeminiModelWithTools(
  tools: StructuredToolInterface[],
  options?: GeminiModelOptions
): ChatGoogleGenerativeAI {
  const model = createGeminiModel(options);
  return model.bindTools(tools);
}

