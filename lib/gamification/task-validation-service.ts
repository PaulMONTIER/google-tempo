import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { addXP } from './progress-service';
import { checkAndUpdateStreak } from './streak-manager';
import { processEventForSkills } from './skill-matcher';
import { XP_REWARDS } from './config/xp-config';
import { updateQuestProgress } from './quest-service';
import { subDays, startOfDay } from 'date-fns';

export interface TaskValidationData {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  completed: boolean;
  validatedAt: Date | null;
  notes: string | null;
  dismissed: boolean;
}

/**
 * Récupère les tâches à valider pour un utilisateur
 * Filtre intelligent : uniquement "goal" ou "task" events, max 7 jours, max 10 tâches
 */
export async function getTasksToValidate(userId: string): Promise<TaskValidationData[]> {
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 7);

  // Récupérer les événements Google Calendar de type "goal" ou "task"
  // Pour l'instant, on récupère tous les événements non validés
  const validations = await prisma.taskValidation.findMany({
    where: {
      userId,
      completed: false,
      dismissed: false,
      eventDate: {
        gte: sevenDaysAgo,
        lte: today,
      },
    },
    orderBy: {
      eventDate: 'desc',
    },
    take: 10, // Max 10 tâches
  });

  logger.debug(`[task-validation-service] ${validations.length} tâches à valider pour userId: ${userId}`);

  return validations.map((v) => ({
    id: v.id,
    eventId: v.eventId,
    eventTitle: v.eventTitle,
    eventDate: v.eventDate,
    completed: v.completed,
    validatedAt: v.validatedAt,
    notes: v.notes,
    dismissed: v.dismissed,
  }));
}

/**
 * Crée une validation de tâche depuis un événement Google Calendar
 */
export async function createTaskValidation(
  userId: string,
  eventId: string,
  eventTitle: string,
  eventDate: Date
): Promise<TaskValidationData> {
  // Vérifier si la validation existe déjà
  const existing = await prisma.taskValidation.findUnique({
    where: { eventId },
  });

  if (existing) {
    return {
      id: existing.id,
      eventId: existing.eventId,
      eventTitle: existing.eventTitle,
      eventDate: existing.eventDate,
      completed: existing.completed,
      validatedAt: existing.validatedAt,
      notes: existing.notes,
      dismissed: existing.dismissed,
    };
  }

  // Créer la validation
  const validation = await prisma.taskValidation.create({
    data: {
      userId,
      eventId,
      eventTitle,
      eventDate: startOfDay(eventDate),
      completed: false,
    },
  });

  logger.debug(`[task-validation-service] Validation créée pour eventId: ${eventId}, userId: ${userId}`);

  return {
    id: validation.id,
    eventId: validation.eventId,
    eventTitle: validation.eventTitle,
    eventDate: validation.eventDate,
    completed: validation.completed,
    validatedAt: validation.validatedAt,
    notes: validation.notes,
    dismissed: validation.dismissed,
  };
}

/**
 * Valide une tâche (marque comme complétée)
 */
export async function validateTask(
  userId: string,
  validationId: string,
  completed: boolean,
  notes?: string
): Promise<void> {
  const validation = await prisma.taskValidation.findUnique({
    where: { id: validationId },
  });

  if (!validation || validation.userId !== userId) {
    throw new Error('Validation de tâche non trouvée');
  }

  if (validation.completed === completed) {
    // Déjà dans l'état demandé
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // Mettre à jour la validation
      await tx.taskValidation.update({
        where: { id: validationId },
        data: {
          completed,
          validatedAt: completed ? new Date() : null,
          notes: notes || validation.notes,
        },
      });

      if (completed) {
        // Ajouter XP et mettre à jour le streak
        await addXP(
          userId,
          XP_REWARDS.TASK_COMPLETED,
          'task_completed',
          validation.eventId
        );
        await checkAndUpdateStreak(userId);
      }
    },
    {
      timeout: 10000, // 10 secondes pour les tests
    }
  );

  // Après la transaction, attribuer XP aux compétences (hors transaction car non critique)
  if (completed) {
    // Estimer la durée à 60 min par défaut si on ne l'a pas
    const duration = 60;
    const matches = await processEventForSkills(userId, validation.eventTitle, duration);

    // Mettre à jour la progression des quêtes
    await updateQuestProgress(userId, matches, duration);
  }

  logger.debug(
    `[task-validation-service] Tâche ${completed ? 'validée' : 'invalidée'} pour validationId: ${validationId}`
  );
}

/**
 * Ignore une tâche (dismiss)
 */
export async function dismissTask(userId: string, validationId: string): Promise<void> {
  const validation = await prisma.taskValidation.findUnique({
    where: { id: validationId },
  });

  if (!validation || validation.userId !== userId) {
    throw new Error('Validation de tâche non trouvée');
  }

  await prisma.taskValidation.update({
    where: { id: validationId },
    data: {
      dismissed: true,
      dismissedAt: new Date(),
    },
  });

  logger.debug(`[task-validation-service] Tâche ignorée pour validationId: ${validationId}`);
}

/**
 * Récupère le nombre de tâches à valider
 */
export async function getPendingTasksCount(userId: string): Promise<number> {
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 7);

  const count = await prisma.taskValidation.count({
    where: {
      userId,
      completed: false,
      dismissed: false,
      eventDate: {
        gte: sevenDaysAgo,
        lte: today,
      },
    },
  });

  return count;
}

