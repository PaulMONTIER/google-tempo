import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { StructuredToolInterface } from "@langchain/core/tools";

/**
 * Options pour la création d'un modèle Gemini
 */
export interface GeminiModelOptions {
  modelName?: string;
  temperature?: number;
  apiKey?: string;
  maxOutputTokens?: number;
}

/**
 * Gestionnaire de rotation des clés API
 * Permet de basculer automatiquement vers une autre clé en cas de quota dépassé
 */
class ApiKeyRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private failedKeys: Set<number> = new Set();

  constructor() {
    this.loadKeys();
  }

  private loadKeys(): void {
    // Charger toutes les clés API disponibles
    const keyEnvVars = [
      'GOOGLE_API_KEY',
      'GOOGLE_API_KEY_2',
      'GOOGLE_API_KEY_3',
      'GOOGLE_API_KEY_4',
      'GOOGLE_API_KEY_5',
    ];

    this.keys = keyEnvVars
      .map(envVar => process.env[envVar])
      .filter((key): key is string => !!key && key.length > 0);

    if (this.keys.length === 0) {
      console.warn('[ApiKeyRotator] Aucune clé API trouvée dans les variables d\'environnement');
    } else {
      console.log(`[ApiKeyRotator] ${this.keys.length} clé(s) API chargée(s)`);
    }
  }

  /**
   * Retourne la clé API actuelle
   */
  getCurrentKey(): string | undefined {
    if (this.keys.length === 0) return undefined;
    return this.keys[this.currentIndex];
  }

  /**
   * Retourne l'index de la clé actuelle
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Retourne le nombre total de clés
   */
  getTotalKeys(): number {
    return this.keys.length;
  }

  /**
   * Marque la clé actuelle comme échouée et passe à la suivante
   * @returns true si on a pu basculer vers une clé non-échouée, false sinon
   */
  markCurrentKeyFailedAndRotate(): boolean {
    this.failedKeys.add(this.currentIndex);
    console.log(`[ApiKeyRotator] Clé ${this.currentIndex + 1} marquée comme échouée (quota dépassé)`);

    // Chercher une clé qui n'a pas encore échoué
    for (let i = 0; i < this.keys.length; i++) {
      const nextIndex = (this.currentIndex + 1 + i) % this.keys.length;
      if (!this.failedKeys.has(nextIndex)) {
        this.currentIndex = nextIndex;
        console.log(`[ApiKeyRotator] Rotation vers la clé ${this.currentIndex + 1}`);
        return true;
      }
    }

    console.warn('[ApiKeyRotator] Toutes les clés ont échoué !');
    return false;
  }

  /**
   * Réinitialise toutes les clés comme disponibles (appelé après un certain temps)
   */
  resetFailedKeys(): void {
    this.failedKeys.clear();
    this.currentIndex = 0;
    console.log('[ApiKeyRotator] Reset des clés échouées');
  }

  /**
   * Vérifie s'il reste des clés disponibles
   */
  hasAvailableKeys(): boolean {
    return this.failedKeys.size < this.keys.length;
  }
}

// Instance singleton du rotateur de clés
export const apiKeyRotator = new ApiKeyRotator();

/**
 * Crée un modèle Gemini configuré avec les options par défaut
 * Utilise automatiquement la rotation de clés API
 * @param options Options de configuration du modèle
 * @returns Instance du modèle ChatGoogleGenerativeAI
 */
export function createGeminiModel(options?: GeminiModelOptions): ChatGoogleGenerativeAI {
  const apiKey = options?.apiKey || apiKeyRotator.getCurrentKey();

  if (!apiKey) {
    throw new Error('Aucune clé API Google disponible. Vérifiez vos variables d\'environnement.');
  }

  return new ChatGoogleGenerativeAI({
    // Gemini 2.5 Flash - compatible avec @langchain/google-genai
    modelName: options?.modelName || "gemini-2.5-flash",
    temperature: options?.temperature ?? 0,
    apiKey: apiKey,
    maxOutputTokens: options?.maxOutputTokens || 2048,
  });
}

/**
 * Crée un modèle avec une clé spécifique (pour les retries)
 */
export function createGeminiModelWithKey(apiKey: string, options?: GeminiModelOptions): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    modelName: options?.modelName || "gemini-2.5-flash",
    temperature: options?.temperature ?? 0,
    apiKey: apiKey,
    maxOutputTokens: options?.maxOutputTokens || 2048,
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
) {
  const model = createGeminiModel(options);
  return model.bindTools(tools);
}

/**
 * Vérifie si une erreur est une erreur de quota dépassé
 */
export function isQuotaExceededError(error: any): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests');
}

