import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

export type EventCategory = 'studies' | 'sport' | 'pro' | 'personal' | 'unknown';

export interface EventClassification {
  eventId: string;
  originalTitle: string;
  category: EventCategory;
  subcategory?: string;
  confidence: number;
  points: number;
  metadata: {
    duration: number;
    wasRecurring: boolean;
    wasCompleted: boolean;
  };
}

export interface ClassificationResult {
  category: EventCategory;
  subcategory: string | null;
  confidence: number;
}

/**
 * Classifie un événement calendrier via Gemini AI
 */
export async function classifyEvent(params: {
  title: string;
  description?: string;
  date: Date;
  duration: number;
}): Promise<ClassificationResult> {
  const { title, description, date, duration } = params;

  const prompt = `Tu es un assistant qui classifie des événements de calendrier.

Événement: "${title}"
Date: ${date.toLocaleDateString('fr-FR')}
Durée: ${duration} minutes
Description: ${description || 'Aucune'}

Classifie cet événement dans UNE des catégories suivantes:
- studies: cours, révisions, examens, TD, TP, bibliothèque, mémoire, thèse, devoirs
- sport: entraînement, match, course, musculation, yoga, natation, vélo, running
- pro: réunion, entretien, stage, travail, projet professionnel, call, meeting
- personal: loisirs, amis, famille, rendez-vous personnels, médecin
- unknown: impossible à déterminer

Réponds UNIQUEMENT en JSON valide (sans markdown): { "category": "...", "subcategory": "...", "confidence": 0.X }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';

    // Parse la réponse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category as EventCategory,
        subcategory: parsed.subcategory || null,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      };
    }
  } catch (error) {
    console.error('Erreur classification Gemini:', error);
  }

  // Fallback: classification par mots-clés
  return classifyByKeywords(title, description);
}

import { CLASSIFICATION_KEYWORDS } from '@/lib/constants/classification-keywords';

/**
 * Classification fallback par mots-clés (si Gemini échoue)
 */
function classifyByKeywords(title: string, description?: string): ClassificationResult {
  const text = `${title} ${description || ''}`.toLowerCase();

  for (const [category, words] of Object.entries(CLASSIFICATION_KEYWORDS)) {
    if (category === 'unknown') continue;
    for (const word of words) {
      if (text.includes(word)) {
        return {
          category: category as EventCategory,
          subcategory: word,
          confidence: 0.7,
        };
      }
    }
  }

  return { category: 'unknown', subcategory: null, confidence: 0.3 };
}


/**
 * Classifie plusieurs événements en batch (plus efficace)
 */
export async function classifyEventsBatch(events: Array<{
  id: string;
  title: string;
  description?: string;
  date: Date;
  duration: number;
}>): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();

  // Traite par lots de 5 pour éviter le rate limiting
  const batchSize = 5;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const promises = batch.map(async (event) => {
      const result = await classifyEvent({
        title: event.title,
        description: event.description,
        date: event.date,
        duration: event.duration,
      });
      return { id: event.id, result };
    });

    const batchResults = await Promise.all(promises);
    for (const { id, result } of batchResults) {
      results.set(id, result);
    }

    // Petite pause entre les batches
    if (i + batchSize < events.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
