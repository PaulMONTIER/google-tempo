import { prisma } from '@/lib/prisma';
import { calculateLevel, xpForLevel } from './config/level-config';
import { XP_REWARDS, STREAK_BONUS } from './config/xp-config';
import { logger } from '@/lib/utils/logger';
import { logLevelUp, logXpGain } from './gamification-logger';

/**
 * Récupère ou crée la progression d'un utilisateur
 */
export async function getOrCreateUserProgress(userId: string) {
  let progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalActions: 0,
        totalTasksCreated: 0,
        totalTasksCompleted: 0,
        totalQuizzesCompleted: 0,
      },
    });
    logger.debug(`UserProgress créé pour userId: ${userId}`);
  }

  return progress;
}

/**
 * Ajoute de l'XP à un utilisateur et met à jour le niveau
 * 
 * Idempotence : Si eventId est fourni, vérifie qu'il n'existe pas déjà dans l'historique
 * pour éviter les doublons en cas de retry.
 * 
 * Transaction : Utilise une transaction Prisma pour garantir la cohérence
 * et éviter les races en cas de requêtes concurrentes.
 */
export async function addXP(
  userId: string,
  amount: number,
  actionType: string,
  eventId?: string,
  multiplier: number = 1.0
): Promise<void> {
  const finalAmount = Math.floor(amount * multiplier);

  // Vérification d'idempotence : si eventId fourni, vérifier qu'il n'existe pas déjà
  if (eventId) {
    const existingHistory = await prisma.xpHistory.findFirst({
      where: {
        eventId,
        actionType,
        userProgress: {
          userId,
        },
      },
    });

    if (existingHistory) {
      logger.debug(`[GAMIFICATION] XP déjà ajouté pour eventId: ${eventId}, userId: ${userId} - idempotence`);
      return; // Déjà traité, éviter le doublon
    }
  }

  // Utiliser une transaction pour garantir la cohérence
  await prisma.$transaction(async (tx) => {
    // Récupérer ou créer la progression (avec verrouillage pour éviter les races)
    let progress = await tx.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await tx.userProgress.create({
        data: {
          userId,
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalActions: 0,
          totalTasksCreated: 0,
          totalTasksCompleted: 0,
          totalQuizzesCompleted: 0,
        },
      });
    }

    const oldLevel = progress.level;
    const oldXp = progress.xp;

    // Calculer le nouveau niveau
    const newXp = progress.xp + finalAmount;
    const newLevel = calculateLevel(newXp);

    // Mettre à jour la progression dans la transaction
    await tx.userProgress.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
        totalActions: progress.totalActions + 1,
      },
    });

    // Créer une entrée dans l'historique XP dans la transaction
    await tx.xpHistory.create({
      data: {
        userProgressId: progress.id,
        amount: finalAmount,
        actionType,
        eventId: eventId || null,
        multiplier,
      },
    });

    // Logging dédié pour analytics
    if (newLevel > oldLevel) {
      // Level-up détecté
      logLevelUp({
        userId,
        oldLevel,
        newLevel,
        xp: newXp,
        xpGained: finalAmount,
        actionType,
        eventId,
      });
    } else {
      // XP gagné sans level-up
      logXpGain(userId, finalAmount, actionType, eventId);
    }
  });

  logger.debug(`XP ajouté: ${finalAmount} (${actionType}) pour userId: ${userId}`);
}

/**
 * Récupère toutes les statistiques de progression d'un utilisateur
 */
export async function getProgressStats(userId: string) {
  try {
    const progress = await getOrCreateUserProgress(userId);

    const currentLevelXp = xpForLevel(progress.level);
    const nextLevelXp = xpForLevel(progress.level + 1);
    const xpToNext = nextLevelXp - progress.xp;
    const progressPercent = ((progress.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

    return {
      xp: progress.xp,
      level: progress.level,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      totalActions: progress.totalActions,
      totalTasksCreated: progress.totalTasksCreated,
      totalTasksCompleted: progress.totalTasksCompleted,
      totalQuizzesCompleted: progress.totalQuizzesCompleted,
      xpToNextLevel: xpToNext,
      progressToNextLevel: Math.min(100, Math.max(0, progressPercent)),
    };
  } catch (error) {
    logger.error('[progress-service] Erreur getProgressStats:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalActions: 0,
      totalTasksCreated: 0,
      totalTasksCompleted: 0,
      totalQuizzesCompleted: 0,
      xpToNextLevel: 100,
      progressToNextLevel: 0,
    };
  }
}

/**
 * Met à jour le niveau basé sur l'XP actuel
 * Utilise une transaction pour garantir la cohérence
 */
export async function updateLevel(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const progress = await tx.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      return; // Pas de progression, rien à faire
    }

    const oldLevel = progress.level;
    const newLevel = calculateLevel(progress.xp);

    if (newLevel !== oldLevel) {
      await tx.userProgress.update({
        where: { userId },
        data: { level: newLevel },
      });

      // Logging dédié pour level-up
      logLevelUp({
        userId,
        oldLevel,
        newLevel,
        xp: progress.xp,
        xpGained: 0, // Pas de gain d'XP, juste recalcul
        actionType: 'level_recalculation',
      });
    }
  });
}

