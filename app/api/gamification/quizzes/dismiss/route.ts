import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { markDoNotAsk } from '@/lib/gamification/quiz-orchestrator';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/gamification/quizzes/dismiss
 * Marque "ne plus demander" pour un événement
 * Body: { eventId: string }
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
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        {
          error: 'Le champ "eventId" est requis',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    logger.debug(`[API /gamification/quizzes/dismiss] POST pour userId: ${userId}, eventId: ${eventId}`);

    await markDoNotAsk(userId, eventId);

    return NextResponse.json({
      success: true,
      message: 'Ne plus demander activé',
    });
  } catch (error: unknown) {
    logger.error('[API /gamification/quizzes/dismiss] Erreur POST:', error);
    return handleApiError(error, 'quiz-dismiss');
  }
}

