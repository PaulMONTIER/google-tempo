import { logger } from '@/lib/utils/logger';

/**
 * Logger dédié pour les événements de gamification
 * Facilite l'analytics ultérieure en traçant les événements importants
 */

interface LevelUpEvent {
  userId: string;
  oldLevel: number;
  newLevel: number;
  xp: number;
  xpGained: number;
  actionType: string;
  eventId?: string;
}

interface StreakChangeEvent {
  userId: string;
  type: 'created' | 'incremented' | 'maintained' | 'broken';
  oldStreak: number;
  newStreak: number;
  longestStreak: number;
  reason?: string;
}

/**
 * Log un événement de level-up
 */
export function logLevelUp(event: LevelUpEvent): void {
  logger.info('[GAMIFICATION] Level Up', {
    userId: event.userId,
    oldLevel: event.oldLevel,
    newLevel: event.newLevel,
    xp: event.xp,
    xpGained: event.xpGained,
    actionType: event.actionType,
    eventId: event.eventId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log un changement de streak
 */
export function logStreakChange(event: StreakChangeEvent): void {
  logger.info('[GAMIFICATION] Streak Change', {
    userId: event.userId,
    type: event.type,
    oldStreak: event.oldStreak,
    newStreak: event.newStreak,
    longestStreak: event.longestStreak,
    reason: event.reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log l'ajout d'XP (sans level-up)
 */
export function logXpGain(
  userId: string,
  amount: number,
  actionType: string,
  eventId?: string
): void {
  logger.debug('[GAMIFICATION] XP Gained', {
    userId,
    amount,
    actionType,
    eventId,
    timestamp: new Date().toISOString(),
  });
}


