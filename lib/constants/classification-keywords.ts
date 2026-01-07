import { EventCategory } from '@/lib/ai/event-classifier';

export const CLASSIFICATION_KEYWORDS: Record<EventCategory, string[]> = {
    studies: [
        'révision', 'revision', 'cours', 'exam', 'partiel', 'td', 'tp', 'biblio',
        'mémoire', 'thèse', 'devoir', 'étude', 'math', 'physique', 'chimie',
        'droit', 'économie'
    ],
    sport: [
        'sport', 'running', 'course', 'musculation', 'yoga', 'natation', 'vélo',
        'cycling', 'football', 'basket', 'tennis', 'entraînement', 'match',
        'gym', 'fitness'
    ],
    pro: [
        'réunion', 'meeting', 'call', 'entretien', 'stage', 'travail', 'projet',
        'client', 'présentation', 'deadline'
    ],
    personal: [
        'médecin', 'rdv', 'famille', 'ami', 'anniversaire', 'resto', 'cinéma',
        'sortie', 'vacances'
    ],
    unknown: [],
};
