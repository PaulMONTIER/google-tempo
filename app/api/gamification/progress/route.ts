import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { getProgressStats, addXP } from '@/lib/gamification/progress-service';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/gamification/progress
 * Récupère la progression de l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;

    logger.debug(`[API /gamification/progress] GET pour userId: ${userId}`);

    const stats = await getProgressStats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    logger.error('[API /gamification/progress] Erreur GET:', error);
    return handleApiError(error, 'gamification-progress');
  }
}

/**
 * POST /api/gamification/progress
 * Met à jour la progression (pour usage interne)
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
    const { amount, actionType, eventId, multiplier } = body;

    if (!amount || !actionType) {
      return NextResponse.json(
        {
          error: 'Les champs "amount" et "actionType" sont requis',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    logger.debug(`[API /gamification/progress] POST pour userId: ${userId}, amount: ${amount}, actionType: ${actionType}`);

    await addXP(userId, amount, actionType, eventId, multiplier || 1.0);

    const stats = await getProgressStats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    logger.error('[API /gamification/progress] Erreur POST:', error);
    return handleApiError(error, 'gamification-progress');
  }
}

