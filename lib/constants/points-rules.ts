import { EventCategory } from '@/lib/ai/event-classifier';

export const POINTS_RULES: Record<EventCategory, {
    base: number;
    durationThreshold: number; // minutes
    durationBonus: number;
    recurrenceBonus: number;
}> = {
    studies: {
        base: 10,
        durationThreshold: 60, // 1h
        durationBonus: 5,
        recurrenceBonus: 3,
    },
    sport: {
        base: 15,
        durationThreshold: 60, // 1h
        durationBonus: 10,
        recurrenceBonus: 5,
    },
    pro: {
        base: 8,
        durationThreshold: 30, // 30min
        durationBonus: 3,
        recurrenceBonus: 2,
    },
    personal: {
        base: 5,
        durationThreshold: 0,
        durationBonus: 0,
        recurrenceBonus: 0,
    },
    unknown: {
        base: 2,
        durationThreshold: 0,
        durationBonus: 0,
        recurrenceBonus: 0,
    },
};

export const TROPHY_LEVELS = [
    { threshold: 0, name: 'Débutant' },
    { threshold: 50, name: 'Apprenti' },
    { threshold: 150, name: 'Confirmé' },
    { threshold: 350, name: 'Expert' },
    { threshold: 700, name: 'Maître' },
    { threshold: 1200, name: 'Légende' },
];
