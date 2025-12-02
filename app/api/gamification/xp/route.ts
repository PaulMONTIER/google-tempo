import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { addXP } from '@/lib/gamification/progress-service';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/gamification/xp
 * Ajoute de l'XP à un utilisateur
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

    logger.debug(`[API /gamification/xp] POST pour userId: ${userId}, amount: ${amount}, actionType: ${actionType}`);

    await addXP(userId, amount, actionType, eventId, multiplier || 1.0);

    return NextResponse.json({
      success: true,
      message: 'XP ajouté avec succès',
    });
  } catch (error: unknown) {
    logger.error('[API /gamification/xp] Erreur POST:', error);
    return handleApiError(error, 'gamification-xp');
  }
}

