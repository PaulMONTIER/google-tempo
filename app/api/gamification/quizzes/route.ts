import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { createQuiz, getQuiz } from '@/lib/gamification/quiz-service';
import {
  checkQuizProposalAfterTaskValidation,
  markQuizProposed,
} from '@/lib/gamification/quiz-orchestrator';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/gamification/quizzes
 * Récupère un quiz existant ou vérifie si un quiz doit être proposé
 * Query params:
 *   - quizId?: string - Si fourni, retourne le quiz
 *   - eventId?: string - Si fourni, vérifie la proposition
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');
    const eventId = searchParams.get('eventId');
    const eventTitle = searchParams.get('eventTitle') || '';

    logger.debug(
      `[API /gamification/quizzes] GET pour userId: ${userId}, quizId: ${quizId || 'none'}, eventId: ${eventId || 'none'}`
    );

    if (quizId) {
      // Récupérer un quiz existant
      const quiz = await getQuiz(quizId, userId);

      if (!quiz) {
        return NextResponse.json(
          {
            error: 'Quiz non trouvé',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: quiz,
      });
    }

    if (eventId) {
      // Vérifier si un quiz doit être proposé
      const proposal = await checkQuizProposalAfterTaskValidation(
        userId,
        eventId,
        eventTitle
      );

      return NextResponse.json({
        success: true,
        data: {
          proposal,
        },
      });
    }

    return NextResponse.json(
      {
        error: 'Les paramètres "quizId" ou "eventId" sont requis',
        code: 'INVALID_REQUEST',
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    logger.error('[API /gamification/quizzes] Erreur GET:', error);
    return handleApiError(error, 'gamification-quizzes');
  }
}

/**
 * POST /api/gamification/quizzes
 * Crée un nouveau quiz
 * Body: { eventId, eventTitle, eventDescription?, goalEventId?, seriesId?, documentation? }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;
    const body = await req.json();
    const { eventId, eventTitle, eventDescription, goalEventId, seriesId, documentation } = body;

    if (!eventId || !eventTitle) {
      return NextResponse.json(
        {
          error: 'Les champs "eventId" et "eventTitle" sont requis',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    logger.debug(`[API /gamification/quizzes] POST pour userId: ${userId}, eventId: ${eventId}`);

    const quiz = await createQuiz(
      userId,
      eventId,
      eventTitle,
      eventDescription,
      goalEventId,
      seriesId,
      documentation
    );

    // Marquer le quiz comme proposé
    await markQuizProposed(userId, eventId);

    return NextResponse.json({
      success: true,
      data: quiz,
    });
  } catch (error: unknown) {
    logger.error('[API /gamification/quizzes] Erreur POST:', error);
    return handleApiError(error, 'gamification-quizzes');
  }
}

