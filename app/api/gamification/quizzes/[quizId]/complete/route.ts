import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { completeQuiz } from '@/lib/gamification/quiz-service';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/gamification/quizzes/[quizId]/complete
 * Finalise le quiz et calcule le score
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;
    const { quizId } = params;

    logger.debug(`[API /gamification/quizzes/${quizId}/complete] POST pour userId: ${userId}`);

    const quiz = await completeQuiz(quizId, userId);

    return NextResponse.json({
      success: true,
      data: quiz,
      message: `Quiz complété ! Score: ${quiz.score}/10`,
    });
  } catch (error: unknown) {
    logger.error(`[API /gamification/quizzes/${params.quizId}/complete] Erreur POST:`, error);
    return handleApiError(error, 'quiz-complete');
  }
}

