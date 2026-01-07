/**
 * Types pour les propositions intelligentes de Tempo
 * Phase 5 : Création Événement IA - Assistant Intelligent
 */

/**
 * Type d'événement détecté sémantiquement
 */
export type EventSemanticType = 
  | 'exam'        // Partiel, examen, contrôle, DS
  | 'competition' // Marathon, course, compétition, match
  | 'deadline'    // Présentation, deadline, rendu
  | 'study'       // Révision, cours, TD
  | 'training'    // Entraînement, séance sport
  | 'meeting'     // Réunion, rdv
  | 'simple';     // Événement simple sans proposition

/**
 * Catégorie de l'événement
 */
export type EventCategory = 'studies' | 'sport' | 'pro' | 'personal';

/**
 * Option de proposition
 */
export interface ProposalOption {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: 'just_event' | 'program' | 'resources' | 'program_resources' | 'block_time';
  // Paramètres additionnels selon l'action
  params?: {
    programType?: 'beginner' | 'intermediate' | 'advanced';
    blockDuration?: number; // en minutes
    blockFrequency?: 'once' | 'daily';
    daysBeforeDeadline?: number;
  };
}

/**
 * Proposition d'événement intelligent
 */
export interface EventProposal {
  id: string;
  type: 'proposal';
  
  // Événement détecté
  event: {
    title: string;
    date: string;        // ISO string
    time?: string;       // HH:mm si fourni
    duration?: number;   // en minutes
    category: EventCategory;
    semanticType: EventSemanticType;
  };
  
  // Message de Tempo
  message: string;
  
  // Options proposées
  options: ProposalOption[];
  
  // Contexte pour le suivi
  context: {
    originalMessage: string;
    detectedSubject?: string;  // Maths, Français, etc.
    detectedSport?: string;    // Course, Natation, etc.
  };
}

/**
 * Réponse de l'utilisateur à une proposition
 */
export interface ProposalResponse {
  proposalId: string;
  selectedOptionId: string;
  additionalParams?: Record<string, unknown>;
}

/**
 * Ressource suggérée
 */
export interface SuggestedResource {
  id: string;
  title: string;
  type: 'course' | 'video' | 'article' | 'certification' | 'app';
  provider: string;      // OpenClassroom, Khan Academy, etc.
  url?: string;
  description?: string;
  estimatedTime?: string; // "2h", "30min", etc.
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Programme généré
 */
export interface GeneratedProgram {
  id: string;
  title: string;
  goalDate: string;
  sessions: ProgramSession[];
  resources?: SuggestedResource[];
}

/**
 * Session d'un programme
 */
export interface ProgramSession {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;  // en minutes
  description?: string;
  order: number;
}

/**
 * Configuration des propositions par type d'événement
 */
export const PROPOSAL_CONFIG: Record<EventSemanticType, {
  category: EventCategory;
  defaultOptions: Omit<ProposalOption, 'id'>[];
}> = {
  exam: {
    category: 'studies',
    defaultOptions: [
      {
        label: 'Juste l\'événement',
        icon: '📅',
        action: 'just_event',
      },
      {
        label: 'Programme de révision',
        description: 'Je crée un planning de révisions adapté',
        icon: '📋',
        action: 'program',
      },
      {
        label: 'Ressources + Programme',
        description: 'Planning + ressources recommandées',
        icon: '📚',
        action: 'program_resources',
      },
    ],
  },
  competition: {
    category: 'sport',
    defaultOptions: [
      {
        label: 'Juste l\'événement',
        icon: '📅',
        action: 'just_event',
      },
      {
        label: 'Programme débutant',
        description: '3 séances/semaine',
        icon: '🏃',
        action: 'program',
        params: { programType: 'beginner' },
      },
      {
        label: 'Programme intermédiaire',
        description: '4 séances/semaine',
        icon: '🏃',
        action: 'program',
        params: { programType: 'intermediate' },
      },
      {
        label: 'Programme avancé',
        description: '5+ séances/semaine',
        icon: '🏃',
        action: 'program',
        params: { programType: 'advanced' },
      },
    ],
  },
  deadline: {
    category: 'pro',
    defaultOptions: [
      {
        label: 'Juste l\'événement',
        icon: '📅',
        action: 'just_event',
      },
      {
        label: 'Bloquer 2h la veille',
        description: 'Temps de préparation',
        icon: '⏰',
        action: 'block_time',
        params: { blockDuration: 120, blockFrequency: 'once', daysBeforeDeadline: 1 },
      },
      {
        label: '1h/jour jusqu\'à la deadline',
        description: 'Préparation progressive',
        icon: '⏰',
        action: 'block_time',
        params: { blockDuration: 60, blockFrequency: 'daily' },
      },
    ],
  },
  study: {
    category: 'studies',
    defaultOptions: [
      {
        label: 'Juste l\'événement',
        icon: '📅',
        action: 'just_event',
      },
      {
        label: 'Voir des ressources',
        description: 'Cours et exercices recommandés',
        icon: '📚',
        action: 'resources',
      },
    ],
  },
  training: {
    category: 'sport',
    defaultOptions: [
      {
        label: 'Juste l\'événement',
        icon: '📅',
        action: 'just_event',
      },
      {
        label: 'Rendre récurrent',
        description: 'Même jour chaque semaine',
        icon: '🔄',
        action: 'program',
      },
    ],
  },
  meeting: {
    category: 'pro',
    defaultOptions: [
      {
        label: 'Créer l\'événement',
        icon: '📅',
        action: 'just_event',
      },
    ],
  },
  simple: {
    category: 'personal',
    defaultOptions: [
      {
        label: 'Créer l\'événement',
        icon: '📅',
        action: 'just_event',
      },
    ],
  },
};

/**
 * Mots-clés pour la détection sémantique
 */
export const SEMANTIC_KEYWORDS: Record<EventSemanticType, string[]> = {
  exam: ['partiel', 'examen', 'exam', 'contrôle', 'controle', 'ds', 'devoir surveillé', 'devoir survéillé', 'interro', 'interrogation', 'concours', 'test'],
  competition: ['marathon', 'course', 'compétition', 'competition', 'match', 'tournoi', 'championnat', 'triathlon', 'semi-marathon', '10km', '5km', 'trail', 'hyrox', 'ironman', 'spartan'],
  deadline: ['présentation', 'presentation', 'deadline', 'rendu', 'livraison', 'soutenance', 'pitch', 'démo', 'demo'],
  study: ['révision', 'revision', 'révisions', 'cours', 'td', 'tp', 'exercices', 'étude', 'etude', 'apprendre'],
  training: ['entraînement', 'entrainement', 'séance', 'seance', 'sport', 'musculation', 'cardio', 'yoga', 'fitness', 'running', 'natation', 'vélo', 'velo'],
  meeting: ['réunion', 'reunion', 'meeting', 'rdv', 'rendez-vous', 'call', 'visio', 'point'],
  simple: [],
};

