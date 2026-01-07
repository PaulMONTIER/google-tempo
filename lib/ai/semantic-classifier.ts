/**
 * Classificateur sémantique intelligent utilisant Gemini
 * Permet de détecter le type d'événement sans hardcoder les mots-clés
 */

import { GoogleGenAI } from '@google/genai';
import { EventSemanticType } from '@/types/proposals';
import { logger } from '@/lib/utils/logger';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

/**
 * Types d'événements supportés avec leurs descriptions
 */
const EVENT_TYPES: Record<EventSemanticType, string> = {
  exam: 'Examen, partiel, contrôle, test scolaire/universitaire, concours',
  competition: 'Compétition sportive, course, marathon, match, tournoi, événement sportif avec classement',
  deadline: 'Deadline, rendu, présentation, soutenance, livraison projet',
  study: 'Session de révision, cours, TD, TP, apprentissage',
  training: 'Entraînement sportif régulier, séance de sport, musculation, yoga',
  meeting: 'Réunion, rendez-vous, call, visio',
  simple: 'Événement simple sans catégorie spécifique',
};

/**
 * Cache pour éviter les appels répétés
 */
const classificationCache = new Map<string, { type: EventSemanticType; confidence: number }>();

/**
 * Classifie un événement en utilisant Gemini
 * @param eventTitle Titre de l'événement
 * @param userMessage Message complet de l'utilisateur (optionnel, pour plus de contexte)
 * @returns Type sémantique et niveau de confiance
 */
export async function classifyEventType(
  eventTitle: string,
  userMessage?: string
): Promise<{ type: EventSemanticType; confidence: number; needsClarification: boolean }> {
  const cacheKey = `${eventTitle}|${userMessage || ''}`.toLowerCase();
  
  // Vérifier le cache
  const cached = classificationCache.get(cacheKey);
  if (cached) {
    return { ...cached, needsClarification: false };
  }

  try {
    const model = genAI.models.generateContent;
    
    const prompt = `Tu es un classificateur d'événements de calendrier.

TYPES POSSIBLES :
${Object.entries(EVENT_TYPES).map(([type, desc]) => `- ${type}: ${desc}`).join('\n')}

ÉVÉNEMENT À CLASSIFIER :
- Titre : "${eventTitle}"
${userMessage ? `- Contexte utilisateur : "${userMessage}"` : ''}

RÉPONDS EN JSON UNIQUEMENT (pas de markdown, pas d'explication) :
{
  "type": "le_type",
  "confidence": 0.0 à 1.0,
  "reason": "explication courte"
}

Si tu n'es pas sûr (confidence < 0.7), mets "simple" avec la confidence réelle.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    
    // Parser la réponse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('[SemanticClassifier] Réponse non-JSON:', text);
      return { type: 'simple', confidence: 0.5, needsClarification: true };
    }

    const result = JSON.parse(jsonMatch[0]);
    const type = result.type as EventSemanticType;
    const confidence = typeof result.confidence === 'number' ? result.confidence : 0.5;

    // Mettre en cache si confiance élevée
    if (confidence >= 0.8) {
      classificationCache.set(cacheKey, { type, confidence });
    }

    logger.debug(`[SemanticClassifier] "${eventTitle}" → ${type} (${(confidence * 100).toFixed(0)}%)`);

    return {
      type: Object.keys(EVENT_TYPES).includes(type) ? type : 'simple',
      confidence,
      needsClarification: confidence < 0.7,
    };

  } catch (error) {
    logger.error('[SemanticClassifier] Erreur:', error);
    return { type: 'simple', confidence: 0.3, needsClarification: true };
  }
}

/**
 * Détection rapide côté frontend (sans appel API)
 * Utilise des patterns courants comme premier filtre
 */
export function quickDetect(text: string): EventSemanticType | null {
  const lower = text.toLowerCase();
  
  // Patterns évidents (rapide, pas d'appel API)
  if (/\b(partiel|examen|exam|contrôle|ds|interro|concours)\b/.test(lower)) return 'exam';
  if (/\b(marathon|course|match|tournoi|compétition|competition)\b/.test(lower)) return 'competition';
  if (/\b(deadline|rendu|présentation|soutenance)\b/.test(lower)) return 'deadline';
  if (/\b(révision|révisions|cours|td|tp)\b/.test(lower)) return 'study';
  if (/\b(entraînement|entrainement|séance|musculation|yoga|fitness)\b/.test(lower)) return 'training';
  if (/\b(réunion|reunion|meeting|rdv|rendez-vous|call|visio)\b/.test(lower)) return 'meeting';
  
  // Pas de match évident → null (l'IA devra classifier)
  return null;
}

/**
 * Détection hybride : rapide d'abord, IA si nécessaire
 */
export async function detectSemanticTypeIntelligent(
  eventTitle: string,
  userMessage?: string
): Promise<{ type: EventSemanticType; confidence: number; source: 'quick' | 'ai' }> {
  // 1. Essayer la détection rapide
  const quickResult = quickDetect(userMessage || eventTitle);
  
  if (quickResult && quickResult !== 'simple') {
    return { type: quickResult, confidence: 0.95, source: 'quick' };
  }
  
  // 2. Si pas de match évident, utiliser l'IA
  const aiResult = await classifyEventType(eventTitle, userMessage);
  
  return {
    type: aiResult.type,
    confidence: aiResult.confidence,
    source: 'ai',
  };
}

