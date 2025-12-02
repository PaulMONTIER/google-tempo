import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { generateQuiz, type GeneratedQuiz } from './quiz-generator-service';
import { addXP } from './progress-service';
import { XP_REWARDS } from './config/xp-config';

export interface QuizData {
  id: string;
  eventId: string;
  eventTitle: string;
  seriesId: string | null;
  score: number;
  totalQuestions: number;
  completed: boolean;
  questions: QuizQuestionData[];
  completedAt: Date | null;
  createdAt: Date;
}

export interface QuizQuestionData {
  id: string;
  order: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | null;
  isCorrect: boolean | null;
  explanation: string | null;
  answeredAt: Date | null;
}

/**
 * Crée un quiz depuis un événement
 */
export async function createQuiz(
  userId: string,
  eventId: string,
  eventTitle: string,
  eventDescription?: string,
  goalEventId?: string,
  seriesId?: string,
  documentation?: string
): Promise<QuizData> {
  // Générer le quiz avec l'IA
  const generatedQuiz = await generateQuiz(
    userId,
    eventId,
    eventTitle,
    eventDescription,
    goalEventId,
    documentation
  );

  // Créer le quiz en base
  const quiz = await prisma.quiz.create({
    data: {
      userId,
      eventId,
      eventTitle,
      seriesId: seriesId || null,
      totalQuestions: 10,
      score: 0,
      completed: false,
      context: JSON.stringify({
        eventDescription,
        goalEventId,
        documentation: documentation ? documentation.substring(0, 500) : null,
      }),
      questions: {
        create: generatedQuiz.questions.map((q, index) => ({
          order: index + 1,
          question: q.question,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      },
    },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  logger.debug(`[quiz-service] Quiz créé: ${quiz.id} pour eventId: ${eventId}`);

  return formatQuizData(quiz);
}

/**
 * Récupère un quiz avec ses questions
 */
export async function getQuiz(quizId: string, userId: string): Promise<QuizData | null> {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      userId,
    },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!quiz) {
    return null;
  }

  return formatQuizData(quiz);
}

/**
 * Répond à une question et retourne la correction immédiate
 */
export async function answerQuestion(
  quizId: string,
  questionId: string,
  userId: string,
  answerIndex: number
): Promise<{ isCorrect: boolean; explanation: string | null }> {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      userId,
    },
    include: {
      questions: true,
    },
  });

  if (!quiz) {
    throw new Error('Quiz non trouvé');
  }

  const question = quiz.questions.find((q) => q.id === questionId);
  if (!question) {
    throw new Error('Question non trouvée');
  }

  if (question.userAnswer !== null) {
    // Question déjà répondue
    return {
      isCorrect: question.isCorrect || false,
      explanation: question.explanation,
    };
  }

  const isCorrect = answerIndex === question.correctAnswer;

  // Mettre à jour la question
  await prisma.quizQuestion.update({
    where: { id: questionId },
    data: {
      userAnswer: answerIndex,
      isCorrect,
      answeredAt: new Date(),
    },
  });

  logger.debug(
    `[quiz-service] Question ${questionId} répondue: ${isCorrect ? 'correct' : 'incorrect'}`
  );

  return {
    isCorrect,
    explanation: question.explanation,
  };
}

/**
 * Finalise le quiz, calcule le score et ajoute XP
 */
export async function completeQuiz(quizId: string, userId: string): Promise<QuizData> {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      userId,
    },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!quiz) {
    throw new Error('Quiz non trouvé');
  }

  if (quiz.completed) {
    // Quiz déjà complété
    return formatQuizData(quiz);
  }

  // Calculer le score
  const correctAnswers = quiz.questions.filter((q) => q.isCorrect === true).length;
  const score = correctAnswers;

  await prisma.$transaction(async (tx) => {
    // Mettre à jour le quiz
    await tx.quiz.update({
      where: { id: quizId },
      data: {
        score,
        completed: true,
        completedAt: new Date(),
      },
    });

    // Ajouter XP avec multiplicateur
    await addXP(
      userId,
      XP_REWARDS.QUIZ_COMPLETED,
      'quiz_completed',
      quiz.eventId,
      XP_REWARDS.QUIZ_MULTIPLIER
    );
  });

  logger.debug(`[quiz-service] Quiz complété: ${quizId}, score: ${score}/10`);

  // Récupérer le quiz mis à jour
  const updatedQuiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!updatedQuiz) {
    throw new Error('Erreur lors de la récupération du quiz');
  }

  return formatQuizData(updatedQuiz);
}

/**
 * Récupère les quiz d'une série
 */
export async function getQuizSeries(seriesId: string, userId: string): Promise<QuizData[]> {
  const quizzes = await prisma.quiz.findMany({
    where: {
      seriesId,
      userId,
    },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return quizzes.map(formatQuizData);
}

/**
 * Formate les données du quiz depuis Prisma
 */
function formatQuizData(quiz: any): QuizData {
  return {
    id: quiz.id,
    eventId: quiz.eventId,
    eventTitle: quiz.eventTitle,
    seriesId: quiz.seriesId,
    score: quiz.score,
    totalQuestions: quiz.totalQuestions,
    completed: quiz.completed,
    questions: quiz.questions.map((q: any) => ({
      id: q.id,
      order: q.order,
      question: q.question,
      options: JSON.parse(q.options),
      correctAnswer: q.correctAnswer,
      userAnswer: q.userAnswer,
      isCorrect: q.isCorrect,
      explanation: q.explanation,
      answeredAt: q.answeredAt,
    })),
    completedAt: quiz.completedAt,
    createdAt: quiz.createdAt,
  };
}


