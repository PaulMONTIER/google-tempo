import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, isSameDay } from 'date-fns';
import { logger } from '@/lib/utils/logger';
import { logStreakChange } from './gamification-logger';

/**
 * Met à jour le streak d'un utilisateur
 * Logique : Streak maintenu si au moins 1 validation aujourd'hui
 * Jours de grâce : 1 jour d'absence autorisé sans casser le streak
 * 
 * Utilise une transaction pour garantir la cohérence et éviter les races
 */
export async function checkAndUpdateStreak(userId: string): Promise<void> {
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  
  // Utiliser une transaction pour garantir la cohérence
  await prisma.$transaction(async (tx) => {
    const progress = await tx.userProgress.findUnique({
      where: { userId },
    });
    
    if (!progress) {
      throw new Error(`UserProgress not found for userId: ${userId}`);
    }
    
    // Vérifier si au moins 1 validation aujourd'hui
    const validationToday = await tx.taskValidation.findFirst({
      where: {
        userId,
        validatedAt: { gte: today },
        completed: true,
      },
    });
    
    if (validationToday) {
      // Streak maintenu ou incrémenté
      const lastValidationDate = progress.lastEventValidationDate;
      const oldStreak = progress.currentStreak;
      
      if (!lastValidationDate) {
        // Première validation
        await tx.userProgress.update({
          where: { userId },
          data: {
            currentStreak: 1,
            longestStreak: 1,
            lastEventValidationDate: today,
          },
        });
        
        logStreakChange({
          userId,
          type: 'created',
          oldStreak: 0,
          newStreak: 1,
          longestStreak: 1,
          reason: 'Première validation',
        });
        return;
      }
      
      const lastDate = startOfDay(lastValidationDate);
      
      if (isSameDay(lastDate, today)) {
        // Déjà validé aujourd'hui, streak inchangé
        return;
      }
      
      if (isSameDay(lastDate, yesterday)) {
        // Validé hier, incrémenter le streak
        const newStreak = progress.currentStreak + 1;
        const newLongestStreak = Math.max(progress.longestStreak, newStreak);
        
        await tx.userProgress.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastEventValidationDate: today,
          },
        });
        
        logStreakChange({
          userId,
          type: 'incremented',
          oldStreak,
          newStreak,
          longestStreak: newLongestStreak,
          reason: 'Validation consécutive',
        });
        return;
      }
      
      // Plus d'un jour d'écart, mais on a validé aujourd'hui
      // Utiliser le "jour de grâce" : si streak > 0, on le maintient
      if (progress.currentStreak > 0) {
        await tx.userProgress.update({
          where: { userId },
          data: {
            lastEventValidationDate: today,
            // Streak maintenu (pas incrémenté, pas cassé)
          },
        });
        
        logStreakChange({
          userId,
          type: 'maintained',
          oldStreak,
          newStreak: oldStreak,
          longestStreak: progress.longestStreak,
          reason: 'Jour de grâce utilisé',
        });
        return;
      }
    } else {
      // Pas de validation aujourd'hui
      const lastValidationDate = progress.lastEventValidationDate;
      
      if (!lastValidationDate) {
        // Jamais validé, streak = 0
        return;
      }
      
      const lastDate = startOfDay(lastValidationDate);
      
      if (isSameDay(lastDate, yesterday)) {
        // Validé hier, pas aujourd'hui : utiliser le jour de grâce
        // Streak maintenu pour aujourd'hui, mais sera cassé demain si pas de validation
        return;
      }
      
      if (isSameDay(lastDate, today)) {
        // Déjà géré ci-dessus
        return;
      }
      
      // Plus de 2 jours sans validation : casser le streak
      if (progress.currentStreak > 0) {
        await tx.userProgress.update({
          where: { userId },
          data: {
            currentStreak: 0,
          },
        });
        
        logStreakChange({
          userId,
          type: 'broken',
          oldStreak: progress.currentStreak,
          newStreak: 0,
          longestStreak: progress.longestStreak,
          reason: 'Plus de 2 jours sans validation',
        });
      }
    }
  });
}

/**
 * Récupère les informations de streak
 */
export async function getStreakInfo(userId: string) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });
  
  if (!progress) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastValidationDate: null,
    };
  }
  
  return {
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    lastValidationDate: progress.lastEventValidationDate,
  };
}

