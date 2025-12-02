import { prisma } from '@/lib/prisma';
import { getActiveReminders, shouldSendReminder } from './reminder-calculator';
import { REMINDER_MESSAGES } from './config/reminder-config';
import { logger } from '@/lib/utils/logger';

export interface Reminder {
  id: string;
  eventId: string;
  title: string;
  goalDate: Date;
  daysBefore: number;
  message: string;
  isUrgent: boolean; // true si J-1 ou Jour J
}

/**
 * Récupère tous les rappels actifs pour un utilisateur
 */
export async function getRemindersForUser(userId: string): Promise<Reminder[]> {
  const today = new Date();
  const reminders: Reminder[] = [];

  // Récupérer tous les arbres de préparation (goals) de l'utilisateur
  const trees = await prisma.preparationTree.findMany({
    where: {
      userId,
      goalDate: {
        gte: today, // Uniquement les goals futurs
      },
    },
    orderBy: {
      goalDate: 'asc',
    },
  });

  // Pour chaque arbre, calculer les rappels actifs
  for (const tree of trees) {
    const activeReminders = getActiveReminders(tree.goalDate);

    for (const reminder of activeReminders) {
      // Vérifier si le rappel a déjà été envoyé (via AgentMemory)
      const memoryKey = `reminder:${tree.goalEventId}:${reminder.daysBefore}`;
      const sentReminder = await prisma.agentMemory.findUnique({
        where: {
          userId_memoryType_key: {
            userId,
            memoryType: 'reminder_sent',
            key: memoryKey,
          },
        },
      });

      // Si le rappel n'a pas été envoyé, l'ajouter à la liste
      if (!sentReminder && shouldSendReminder(reminder.date)) {
        const isUrgent = reminder.daysBefore <= 1; // J-1 ou Jour J
        const message = REMINDER_MESSAGES.GOAL_APPROACHING(reminder.daysBefore, tree.goalTitle);

        reminders.push({
          id: `${tree.goalEventId}-${reminder.daysBefore}`,
          eventId: tree.goalEventId,
          title: tree.goalTitle,
          goalDate: tree.goalDate,
          daysBefore: reminder.daysBefore,
          message,
          isUrgent,
        });
      }
    }
  }

  // Trier par urgence (urgent en premier), puis par date
  reminders.sort((a, b) => {
    if (a.isUrgent !== b.isUrgent) {
      return a.isUrgent ? -1 : 1;
    }
    return a.goalDate.getTime() - b.goalDate.getTime();
  });

  logger.debug(`[reminder-service] ${reminders.length} rappels actifs pour userId: ${userId}`);

  return reminders;
}

/**
 * Marque un rappel comme envoyé
 */
export async function markReminderAsSent(
  userId: string,
  eventId: string,
  reminderDay: number
): Promise<void> {
  const memoryKey = `reminder:${eventId}:${reminderDay}`;

  await prisma.agentMemory.upsert({
    where: {
      userId_memoryType_key: {
        userId,
        memoryType: 'reminder_sent',
        key: memoryKey,
      },
    },
    create: {
      userId,
      memoryType: 'reminder_sent',
      key: memoryKey,
      value: JSON.stringify({ sentAt: new Date().toISOString() }),
    },
    update: {
      value: JSON.stringify({ sentAt: new Date().toISOString() }),
      updatedAt: new Date(),
    },
  });

  logger.debug(`[reminder-service] Rappel marqué comme envoyé: ${memoryKey}`);
}

/**
 * Récupère les objectifs à venir pour un utilisateur
 */
export async function getUpcomingGoals(userId: string, limit: number = 10) {
  const today = new Date();

  const goals = await prisma.preparationTree.findMany({
    where: {
      userId,
      goalDate: {
        gte: today,
      },
    },
    orderBy: {
      goalDate: 'asc',
    },
    take: limit,
  });

  return goals;
}


