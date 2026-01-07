import { EventCategory } from '@/lib/ai/event-classifier';

export interface PointsCalculation {
  basePoints: number;
  durationBonus: number;
  recurrenceBonus: number;
  totalPoints: number;
  breakdown: string[];
}

import { POINTS_RULES, TROPHY_LEVELS } from '@/lib/constants/points-rules';

/**
 * Calcule les points pour un événement classifié
 */
export function calculatePoints(params: {
  category: EventCategory;
  duration: number; // minutes
  isRecurring: boolean;
  confidence: number;
}): PointsCalculation {
  const { category, duration, isRecurring, confidence } = params;
  const rules = POINTS_RULES[category];
  const breakdown: string[] = [];

  // Points de base
  const basePoints = rules.base;
  breakdown.push(`Base ${category}: ${basePoints} pts`);

  // Bonus durée
  let durationBonus = 0;
  if (rules.durationThreshold > 0 && duration >= rules.durationThreshold) {
    durationBonus = rules.durationBonus;
    breakdown.push(`Durée > ${rules.durationThreshold}min: +${durationBonus} pts`);
  }

  // Bonus récurrence
  let recurrenceBonus = 0;
  if (isRecurring && rules.recurrenceBonus > 0) {
    recurrenceBonus = rules.recurrenceBonus;
    breakdown.push(`Événement récurrent: +${recurrenceBonus} pts`);
  }

  // Total avec ajustement confiance (si confiance < 0.5, réduit les points)
  const rawTotal = basePoints + durationBonus + recurrenceBonus;
  const confidenceMultiplier = confidence >= 0.5 ? 1 : 0.5 + confidence;
  const totalPoints = Math.round(rawTotal * confidenceMultiplier);

  if (confidenceMultiplier < 1) {
    breakdown.push(`Confiance ${Math.round(confidence * 100)}%: ajusté`);
  }

  return {
    basePoints,
    durationBonus,
    recurrenceBonus,
    totalPoints,
    breakdown,
  };
}

/**
 * Calcule les points totaux pour une liste d'événements classifiés
 */
export function calculateTotalPoints(events: Array<{
  category: EventCategory;
  duration: number;
  isRecurring: boolean;
  confidence: number;
}>): {
  total: number;
  byCategory: Record<EventCategory, { count: number; points: number }>;
} {
  const byCategory: Record<EventCategory, { count: number; points: number }> = {
    studies: { count: 0, points: 0 },
    sport: { count: 0, points: 0 },
    pro: { count: 0, points: 0 },
    personal: { count: 0, points: 0 },
    unknown: { count: 0, points: 0 },
  };

  let total = 0;

  for (const event of events) {
    const { totalPoints } = calculatePoints(event);
    byCategory[event.category].count++;
    byCategory[event.category].points += totalPoints;
    total += totalPoints;
  }

  return { total, byCategory };
}

/**
 * Calcule le niveau de trophée basé sur les points
 */
export function calculateTrophyLevel(points: number): {
  level: number;
  name: string;
  nextLevelPoints: number;
  progress: number;
} {
  let currentLevel = 0;
  let currentName = TROPHY_LEVELS[0].name;
  let nextThreshold = TROPHY_LEVELS[1]?.threshold || Infinity;

  for (let i = 0; i < TROPHY_LEVELS.length; i++) {
    if (points >= TROPHY_LEVELS[i].threshold) {
      currentLevel = i;
      currentName = TROPHY_LEVELS[i].name;
      nextThreshold = TROPHY_LEVELS[i + 1]?.threshold || Infinity;
    }
  }

  const currentThreshold = TROPHY_LEVELS[currentLevel].threshold;
  const progress = nextThreshold === Infinity
    ? 100
    : Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100);

  return {
    level: currentLevel + 1,
    name: currentName,
    nextLevelPoints: nextThreshold,
    progress: Math.min(progress, 100),
  };
}



