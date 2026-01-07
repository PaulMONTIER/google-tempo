/**
 * Détecteur de propositions côté frontend
 * Analyse les messages pour déterminer si une proposition doit être affichée
 * 
 * STRATÉGIE HYBRIDE :
 * 1. Détection rapide par mots-clés (instantané, pas d'appel API)
 * 2. Si pas de match, utilise le contexte (titre de l'événement créé)
 * 3. Pour les cas ambigus, l'IA peut être appelée côté backend
 */

import { EventSemanticType, SEMANTIC_KEYWORDS, PROPOSAL_CONFIG, ProposalOption } from '@/types/proposals';

// Mots-clés supplémentaires pour une meilleure détection
const ENHANCED_KEYWORDS: Record<EventSemanticType, RegExp[]> = {
  exam: [
    /\b(partiel|examen|exam|contrôle|controle|ds|interro|interrogation|concours|test|épreuve|epreuve|bac|diplome|diplôme)\b/i,
    /\b(oral|écrit|soutenance)\b/i,
  ],
  competition: [
    /\b(marathon|course|compétition|competition|match|tournoi|championnat|triathlon|trail|hyrox|ironman|spartan)\b/i,
    /\b(\d+\s*km|\d+\s*k|semi|ultra|run|race)\b/i,
  ],
  deadline: [
    /\b(présentation|presentation|deadline|rendu|livraison|soutenance|pitch|démo|demo|livrable)\b/i,
    /\b(projet|client|rapport|mémoire|memoire|thèse|these)\b/i,
  ],
  study: [
    /\b(révision|revision|réviser|reviser|cours|td|tp|exercices|étude|etude|apprendre|travailler)\b/i,
    /\b(chapitre|module|leçon|lecon)\b/i,
  ],
  training: [
    /\b(entraînement|entrainement|séance|seance|sport|musculation|cardio|yoga|fitness|running|natation|vélo|velo)\b/i,
    /\b(gym|salle|piscine|footing|jogging)\b/i,
  ],
  meeting: [
    /\b(réunion|reunion|meeting|rdv|rendez-vous|call|visio|point|sync|standup)\b/i,
  ],
  simple: [],
};

/**
 * Détecte le type sémantique d'un message (détection rapide)
 */
export function detectSemanticType(message: string): EventSemanticType {
  const lowerMessage = message.toLowerCase();
  
  // D'abord essayer avec les regex améliorées
  for (const [type, patterns] of Object.entries(ENHANCED_KEYWORDS)) {
    if (type === 'simple') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        console.log(`[ProposalDetector] Match regex pour ${type}:`, pattern.source);
        return type as EventSemanticType;
      }
    }
  }
  
  // Fallback sur les mots-clés simples
  for (const [type, keywords] of Object.entries(SEMANTIC_KEYWORDS)) {
    if (type === 'simple') continue;
    
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        console.log(`[ProposalDetector] Match keyword pour ${type}:`, keyword);
        return type as EventSemanticType;
      }
    }
  }
  
  console.log('[ProposalDetector] Aucun match, retour simple');
  return 'simple';
}

/**
 * Détecte le type sémantique avec plus de contexte
 * Analyse le titre de l'événement en plus du message utilisateur
 */
export function detectSemanticTypeWithContext(
  userMessage: string,
  eventTitle: string
): EventSemanticType {
  // 1. D'abord essayer avec le message utilisateur complet
  const fromMessage = detectSemanticType(userMessage);
  if (fromMessage !== 'simple') {
    return fromMessage;
  }
  
  // 2. Ensuite essayer avec le titre de l'événement
  const fromTitle = detectSemanticType(eventTitle);
  if (fromTitle !== 'simple') {
    return fromTitle;
  }
  
  // 3. Heuristiques basées sur le contexte
  const lowerTitle = eventTitle.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();
  const combined = `${lowerMessage} ${lowerTitle}`;
  
  // Patterns sportifs génériques (compétitions)
  if (/\b(km|k|miles?|ultra|race|run|swim|bike|triathlon)\b/.test(combined)) {
    return 'competition';
  }
  
  // Patterns académiques
  if (/\b(chapitre|module|semestre|exo|exercice)\b/.test(combined)) {
    return 'study';
  }
  
  // Patterns professionnels
  if (/\b(projet|client|livrable|sprint|demo)\b/.test(combined)) {
    return 'deadline';
  }
  
  return 'simple';
}

/**
 * Extrait le sujet/matière d'un message
 */
export function extractSubject(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Matières scolaires
  const subjects = [
    'maths', 'mathématiques', 'français', 'francais', 'anglais', 'histoire',
    'géographie', 'geographie', 'physique', 'chimie', 'svt', 'biologie',
    'philosophie', 'philo', 'économie', 'economie', 'informatique', 'programmation',
    'marketing', 'management', 'droit', 'comptabilité', 'comptabilite'
  ];
  
  for (const subject of subjects) {
    if (lowerMessage.includes(subject)) {
      return subject.charAt(0).toUpperCase() + subject.slice(1);
    }
  }
  
  return null;
}

/**
 * Extrait le sport d'un message
 */
export function extractSport(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  const sports = [
    'marathon', 'course', 'running', 'jogging', 'trail',
    'natation', 'vélo', 'velo', 'cyclisme',
    'musculation', 'fitness', 'crossfit',
    'yoga', 'pilates',
    'football', 'foot', 'basket', 'tennis', 'badminton',
    'boxe', 'judo', 'karaté', 'karate'
  ];
  
  for (const sport of sports) {
    if (lowerMessage.includes(sport)) {
      return sport.charAt(0).toUpperCase() + sport.slice(1);
    }
  }
  
  return null;
}

/**
 * Génère les options de proposition pour un type d'événement
 */
export function getProposalOptions(semanticType: EventSemanticType): ProposalOption[] {
  const config = PROPOSAL_CONFIG[semanticType];
  
  return config.defaultOptions.map((opt, index) => ({
    ...opt,
    id: `${semanticType}-${index}`,
  }));
}

/**
 * Vérifie si un message de confirmation d'événement nécessite une proposition
 */
export function shouldShowProposal(
  userMessage: string,
  assistantMessage: string
): { show: boolean; semanticType: EventSemanticType; subject?: string; sport?: string } {
  // Vérifier que l'assistant confirme la création d'un événement
  const confirmationPatterns = [
    /j'ai noté/i,
    /j'ai créé/i,
    /c'est noté/i,
    /événement créé/i,
    /ajouté à ton calendrier/i,
  ];
  
  const isConfirmation = confirmationPatterns.some(p => p.test(assistantMessage));
  
  if (!isConfirmation) {
    return { show: false, semanticType: 'simple' };
  }
  
  const semanticType = detectSemanticType(userMessage);
  
  // Pas de proposition pour les événements simples ou réunions
  if (semanticType === 'simple' || semanticType === 'meeting') {
    return { show: false, semanticType };
  }
  
  const subject = extractSubject(userMessage);
  const sport = extractSport(userMessage);
  
  return {
    show: true,
    semanticType,
    subject: subject || undefined,
    sport: sport || undefined,
  };
}

/**
 * Génère le message à envoyer à l'agent en fonction de l'option choisie
 */
export function buildAgentMessage(
  option: ProposalOption,
  context: {
    eventTitle: string;
    eventDate: string;
    subject?: string;
    sport?: string;
  }
): string {
  const { eventTitle, eventDate, subject, sport } = context;
  
  switch (option.action) {
    case 'just_event':
      return ''; // Pas de message à envoyer
      
    case 'program':
      if (option.params?.programType) {
        // Programme sport
        return `Crée-moi un programme d'entraînement ${option.params.programType === 'beginner' ? 'débutant' : option.params.programType === 'intermediate' ? 'intermédiaire' : 'avancé'} pour préparer "${eventTitle}" le ${eventDate}. ${sport ? `Sport: ${sport}.` : ''}`;
      } else {
        // Programme révision
        return `Crée-moi un programme de révision pour "${eventTitle}" le ${eventDate}. ${subject ? `Matière: ${subject}.` : ''}`;
      }
      
    case 'resources':
      return `Propose-moi des ressources pour "${eventTitle}". ${subject ? `Matière: ${subject}.` : ''}`;
      
    case 'program_resources':
      return `Crée-moi un programme de révision avec des ressources pour "${eventTitle}" le ${eventDate}. ${subject ? `Matière: ${subject}.` : ''}`;
      
    case 'block_time':
      if (option.params?.blockFrequency === 'daily') {
        return `Bloque-moi ${option.params.blockDuration} minutes par jour jusqu'au ${eventDate} pour préparer "${eventTitle}".`;
      } else {
        return `Bloque-moi ${option.params?.blockDuration || 120} minutes ${option.params?.daysBeforeDeadline || 1} jour(s) avant "${eventTitle}" le ${eventDate}.`;
      }
      
    default:
      return '';
  }
}

