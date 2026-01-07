import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { answerQuestion } from '@/lib/gamification/quiz-service';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/gamification/quizzes/[quizId]/answer
 * Répond à une question du quiz
 * Body: { questionId: string, answerIndex: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;
    const { quizId } = await params;
    const body = await req.json();
    const { questionId, answerIndex } = body;

    if (!questionId || answerIndex === undefined) {
      return NextResponse.json(
        {
          error: 'Les champs "questionId" et "answerIndex" sont requis',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    if (answerIndex < 0 || answerIndex > 3) {
      return NextResponse.json(
        {
          error: 'answerIndex doit être entre 0 et 3',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    logger.debug(
      `[API /gamification/quizzes/${quizId}/answer] POST pour userId: ${userId}, questionId: ${questionId}, answerIndex: ${answerIndex}`
    );

    const result = await answerQuestion(quizId, questionId, userId, answerIndex);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    logger.error('[API /gamification/quizzes/[quizId]/answer] Erreur POST:', error);
    return handleApiError(error, 'quiz-answer');
  }
}

