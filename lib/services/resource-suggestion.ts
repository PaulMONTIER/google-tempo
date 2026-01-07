/**
 * Service de suggestions de ressources
 * Phase 5 : Propositions intelligentes après création d'événement
 * 
 * Suggère des ressources pertinentes en fonction de la matière/sport détecté
 */

import { SuggestedResource } from '@/types/proposals';
import { RESOURCE_DATABASE, SUBJECT_SYNONYMS } from '@/lib/constants/resource-db';


/**
 * Récupère les ressources suggérées pour un sujet donné
 */
export function getResourcesForSubject(subject: string): SuggestedResource[] {
  const normalizedSubject = subject.toLowerCase().trim();

  // Chercher directement
  if (RESOURCE_DATABASE[normalizedSubject]) {
    return RESOURCE_DATABASE[normalizedSubject];
  }

  // Chercher via synonymes
  const mappedKey = SUBJECT_SYNONYMS[normalizedSubject];
  if (mappedKey && RESOURCE_DATABASE[mappedKey]) {
    return RESOURCE_DATABASE[mappedKey];
  }

  // Chercher par correspondance partielle
  for (const [key, resources] of Object.entries(RESOURCE_DATABASE)) {
    if (normalizedSubject.includes(key) || key.includes(normalizedSubject)) {
      return resources;
    }
  }

  return [];
}

/**
 * Récupère les ressources suggérées pour un sport donné
 */
export function getResourcesForSport(sport: string): SuggestedResource[] {
  return getResourcesForSubject(sport);
}

/**
 * Génère une suggestion de ressource basée sur le contexte
 */
export function generateResourceSuggestion(
  eventTitle: string,
  subject?: string,
  sport?: string
): { resources: SuggestedResource[]; message: string } {
  let resources: SuggestedResource[] = [];
  let message = '';

  if (subject) {
    resources = getResourcesForSubject(subject);
    if (resources.length > 0) {
      message = `Voici des ressources pour t'aider en ${subject} :`;
    }
  } else if (sport) {
    resources = getResourcesForSport(sport);
    if (resources.length > 0) {
      message = `Voici des ressources pour ton entraînement de ${sport} :`;
    }
  } else {
    // Essayer de détecter depuis le titre
    const titleLower = eventTitle.toLowerCase();

    for (const [key, res] of Object.entries(RESOURCE_DATABASE)) {
      if (titleLower.includes(key)) {
        resources = res;
        message = `Voici des ressources qui pourraient t'aider :`;
        break;
      }
    }

    // Vérifier les synonymes
    if (resources.length === 0) {
      for (const [synonym, key] of Object.entries(SUBJECT_SYNONYMS)) {
        if (titleLower.includes(synonym)) {
          resources = RESOURCE_DATABASE[key] || [];
          message = `Voici des ressources qui pourraient t'aider :`;
          break;
        }
      }
    }
  }

  // Limiter à 3 ressources maximum
  resources = resources.slice(0, 3);

  return { resources, message };
}

/**
 * Formate les ressources en texte pour l'agent
 */
export function formatResourcesAsText(resources: SuggestedResource[]): string {
  if (resources.length === 0) {
    return "Je n'ai pas trouvé de ressources spécifiques pour ce sujet.";
  }

  const lines = resources.map((r, i) => {
    let line = `${i + 1}. **${r.title}** (${r.provider})`;
    if (r.description) line += `\n   ${r.description}`;
    if (r.estimatedTime) line += `\n   ⏱️ ${r.estimatedTime}`;
    if (r.url) line += `\n   🔗 ${r.url}`;
    return line;
  });

  return lines.join('\n\n');
}

