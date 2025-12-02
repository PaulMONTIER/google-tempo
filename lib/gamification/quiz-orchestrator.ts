import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { startOfDay, isSameDay } from 'date-fns';

export interface QuizProposal {
  shouldPropose: boolean;
  reason?: string;
  eventId?: string;
  eventTitle?: string;
}

/**
 * Vérifie si un quiz doit être proposé pour un événement
 * Règles :
 * - Max 1 quiz proposé par jour
 * - Uniquement pour les événements "goal"
 * - Probabilité 30-50% (aléatoire)
 * - Option "ne plus demander" respectée
 */
export async function shouldProposeQuiz(
  userId: string,
  eventId: string,
  eventTitle: string,
  isGoalEvent: boolean = false
): Promise<QuizProposal> {
  // Règle 1 : Uniquement pour les événements "goal"
  if (!isGoalEvent) {
    return {
      shouldPropose: false,
      reason: 'Seuls les événements objectifs peuvent avoir un quiz',
    };
  }

  // Règle 2 : Vérifier si l'utilisateur a choisi "ne plus demander"
  const doNotAskMemory = await prisma.agentMemory.findUnique({
    where: {
      userId_memoryType_key: {
        userId,
        memoryType: 'quiz_preference',
        key: `do_not_ask:${eventId}`,
      },
    },
  });

  if (doNotAskMemory) {
    return {
      shouldPropose: false,
      reason: 'Utilisateur a choisi de ne plus être sollicité',
    };
  }

  // Règle 3 : Max 1 quiz proposé par jour
  const today = startOfDay(new Date());
  const todayProposal = await prisma.agentMemory.findFirst({
    where: {
      userId,
      memoryType: 'quiz_proposal',
      key: {
        startsWith: `proposed:${today.toISOString().split('T')[0]}`,
      },
    },
  });

  if (todayProposal) {
    return {
      shouldPropose: false,
      reason: 'Un quiz a déjà été proposé aujourd\'hui',
    };
  }

  // Règle 4 : Vérifier si un quiz existe déjà pour cet événement
  const existingQuiz = await prisma.quiz.findFirst({
    where: {
      userId,
      eventId,
    },
  });

  if (existingQuiz) {
    return {
      shouldPropose: false,
      reason: 'Un quiz existe déjà pour cet événement',
    };
  }

  // Règle 5 : Probabilité 30-50% (aléatoire)
  const probability = Math.random();
  const threshold = 0.4; // 40% de chance

  if (probability > threshold) {
    return {
      shouldPropose: false,
      reason: 'Probabilité non atteinte (throttling)',
    };
  }

  // Toutes les conditions sont remplies
  return {
    shouldPropose: true,
    eventId,
    eventTitle,
  };
}

/**
 * Marque qu'un quiz a été proposé aujourd'hui
 */
export async function markQuizProposed(userId: string, eventId: string): Promise<void> {
  const today = startOfDay(new Date());
  const key = `proposed:${today.toISOString().split('T')[0]}:${eventId}`;

  await prisma.agentMemory.upsert({
    where: {
      userId_memoryType_key: {
        userId,
        memoryType: 'quiz_proposal',
        key,
      },
    },
    create: {
      userId,
      memoryType: 'quiz_proposal',
      key,
      value: JSON.stringify({
        eventId,
        proposedAt: new Date().toISOString(),
      }),
    },
    update: {
      value: JSON.stringify({
        eventId,
        proposedAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    },
  });

  logger.debug(`[quiz-orchestrator] Quiz proposé marqué pour userId: ${userId}, eventId: ${eventId}`);
}

/**
 * Marque que l'utilisateur ne veut plus être sollicité pour cet événement
 */
export async function markDoNotAsk(userId: string, eventId: string): Promise<void> {
  const key = `do_not_ask:${eventId}`;

  await prisma.agentMemory.upsert({
    where: {
      userId_memoryType_key: {
        userId,
        memoryType: 'quiz_preference',
        key,
      },
    },
    create: {
      userId,
      memoryType: 'quiz_preference',
      key,
      value: JSON.stringify({
        eventId,
        dismissedAt: new Date().toISOString(),
      }),
    },
    update: {
      value: JSON.stringify({
        eventId,
        dismissedAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    },
  });

  logger.debug(`[quiz-orchestrator] "Ne plus demander" marqué pour userId: ${userId}, eventId: ${eventId}`);
}

/**
 * Vérifie si un quiz doit être proposé après validation d'une tâche
 */
export async function checkQuizProposalAfterTaskValidation(
  userId: string,
  eventId: string,
  eventTitle: string
): Promise<QuizProposal> {
  // Vérifier si l'événement est un "goal" (via PreparationTree)
  const tree = await prisma.preparationTree.findFirst({
    where: {
      userId,
      goalEventId: eventId,
    },
  });

  const isGoalEvent = !!tree;

  return shouldProposeQuiz(userId, eventId, eventTitle, isGoalEvent);
}


