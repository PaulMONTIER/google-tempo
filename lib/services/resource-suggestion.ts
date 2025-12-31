/**
 * Service de suggestions de ressources
 * Phase 5 : Propositions intelligentes après création d'événement
 * 
 * Suggère des ressources pertinentes en fonction de la matière/sport détecté
 */

import { SuggestedResource } from '@/types/proposals';

// Base de données de ressources par catégorie
const RESOURCE_DATABASE: Record<string, SuggestedResource[]> = {
  // === MATIÈRES SCOLAIRES ===
  maths: [
    {
      id: 'khan-maths',
      title: 'Khan Academy - Mathématiques',
      type: 'course',
      provider: 'Khan Academy',
      url: 'https://fr.khanacademy.org/math',
      description: 'Cours gratuits de maths du collège au supérieur',
      estimatedTime: 'Variable',
      difficulty: 'beginner',
    },
    {
      id: 'oc-maths',
      title: 'OpenClassrooms - Statistiques',
      type: 'course',
      provider: 'OpenClassrooms',
      url: 'https://openclassrooms.com/fr/courses/4525266-decrivez-et-nettoyez-votre-jeu-de-donnees',
      description: 'Apprenez les statistiques descriptives',
      estimatedTime: '10h',
      difficulty: 'intermediate',
    },
    {
      id: 'brilliant-maths',
      title: 'Brilliant - Fondamentaux mathématiques',
      type: 'app',
      provider: 'Brilliant',
      url: 'https://brilliant.org/courses/math-fundamentals/',
      description: 'Apprentissage interactif des maths',
      estimatedTime: '15h',
      difficulty: 'beginner',
    },
  ],
  
  physique: [
    {
      id: 'khan-physics',
      title: 'Khan Academy - Physique',
      type: 'course',
      provider: 'Khan Academy',
      url: 'https://fr.khanacademy.org/science/physics',
      description: 'Cours de physique complets et gratuits',
      estimatedTime: 'Variable',
      difficulty: 'intermediate',
    },
    {
      id: 'physics-videos',
      title: "E-penser - Vulgarisation scientifique",
      type: 'video',
      provider: 'YouTube',
      url: 'https://www.youtube.com/c/Epenser1',
      description: 'Vidéos de vulgarisation physique',
      estimatedTime: '30min/vidéo',
      difficulty: 'beginner',
    },
  ],

  informatique: [
    {
      id: 'oc-python',
      title: 'OpenClassrooms - Python',
      type: 'course',
      provider: 'OpenClassrooms',
      url: 'https://openclassrooms.com/fr/courses/7168871-apprenez-les-bases-du-langage-python',
      description: 'Apprenez Python de zéro',
      estimatedTime: '15h',
      difficulty: 'beginner',
    },
    {
      id: 'codecademy',
      title: 'Codecademy - Programmation',
      type: 'course',
      provider: 'Codecademy',
      url: 'https://www.codecademy.com/',
      description: 'Cours interactifs de programmation',
      estimatedTime: 'Variable',
      difficulty: 'beginner',
    },
    {
      id: 'coursera-ml',
      title: 'Machine Learning - Stanford',
      type: 'certification',
      provider: 'Coursera',
      url: 'https://www.coursera.org/learn/machine-learning',
      description: 'Le cours de ML le plus célèbre par Andrew Ng',
      estimatedTime: '60h',
      difficulty: 'advanced',
    },
  ],

  anglais: [
    {
      id: 'duolingo',
      title: 'Duolingo - Anglais',
      type: 'app',
      provider: 'Duolingo',
      url: 'https://www.duolingo.com/course/en/fr/Learn-English',
      description: 'Apprends l\'anglais gratuitement',
      estimatedTime: '15min/jour',
      difficulty: 'beginner',
    },
    {
      id: 'bbc-learning',
      title: 'BBC Learning English',
      type: 'course',
      provider: 'BBC',
      url: 'https://www.bbc.co.uk/learningenglish/',
      description: 'Ressources gratuites de la BBC',
      estimatedTime: 'Variable',
      difficulty: 'intermediate',
    },
  ],

  // === SPORTS ===
  marathon: [
    {
      id: 'plan-marathon-debutant',
      title: 'Plan Marathon Débutant - 16 semaines',
      type: 'article',
      provider: 'Running Addict',
      url: 'https://www.running-addict.fr/conseil-running/plan-entrainement-marathon/',
      description: 'Programme complet pour premier marathon',
      estimatedTime: '16 semaines',
      difficulty: 'beginner',
    },
    {
      id: 'kipchoge-doc',
      title: 'Documentaire Eliud Kipchoge',
      type: 'video',
      provider: 'YouTube',
      description: 'Inspiration et techniques du meilleur marathonien',
      estimatedTime: '1h30',
      difficulty: 'beginner',
    },
  ],

  course: [
    {
      id: 'plan-10k',
      title: 'Plan 10km - 8 semaines',
      type: 'article',
      provider: 'Jogging International',
      description: 'Programme pour courir 10km',
      estimatedTime: '8 semaines',
      difficulty: 'beginner',
    },
    {
      id: 'strava-app',
      title: 'Strava - Suivi course',
      type: 'app',
      provider: 'Strava',
      url: 'https://www.strava.com/',
      description: 'Application de suivi GPS et communauté',
      difficulty: 'beginner',
    },
  ],

  musculation: [
    {
      id: 'strong-app',
      title: 'Strong - Suivi musculation',
      type: 'app',
      provider: 'Strong',
      description: 'Application de suivi de séances',
      difficulty: 'beginner',
    },
    {
      id: 'athlean-x',
      title: 'ATHLEAN-X',
      type: 'video',
      provider: 'YouTube',
      url: 'https://www.youtube.com/user/JDCav24',
      description: 'Conseils et programmes de musculation',
      estimatedTime: '15min/vidéo',
      difficulty: 'intermediate',
    },
  ],

  // === PRO ===
  presentation: [
    {
      id: 'ted-talks',
      title: 'TED Talks - Public Speaking',
      type: 'video',
      provider: 'TED',
      url: 'https://www.ted.com/playlists/574/how_to_make_a_great_presentation',
      description: 'Apprenez l\'art de la présentation',
      estimatedTime: '2h',
      difficulty: 'intermediate',
    },
    {
      id: 'canva',
      title: 'Canva - Créer des présentations',
      type: 'app',
      provider: 'Canva',
      url: 'https://www.canva.com/',
      description: 'Outil de design pour présentations',
      difficulty: 'beginner',
    },
  ],
};

// Mapping des synonymes vers les clés de la base
const SUBJECT_SYNONYMS: Record<string, string> = {
  mathématiques: 'maths',
  math: 'maths',
  physique: 'physique',
  chimie: 'physique',
  programmation: 'informatique',
  code: 'informatique',
  python: 'informatique',
  javascript: 'informatique',
  running: 'course',
  jogging: 'course',
  footing: 'course',
  semi: 'marathon',
  trail: 'marathon',
  '10km': 'course',
  '5km': 'course',
  gym: 'musculation',
  fitness: 'musculation',
  présentation: 'presentation',
  pitch: 'presentation',
  soutenance: 'presentation',
};

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

