import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import {
  getTasksToValidate,
  validateTask,
  dismissTask,
  getPendingTasksCount,
} from '@/lib/gamification/task-validation-service';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/gamification/task-validations
 * Récupère les tâches à valider pour l'utilisateur
 * Query params:
 *   - count?: boolean - Si true, retourne uniquement le nombre
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
    const countOnly = searchParams.get('count') === 'true';

    logger.debug(`[API /task-validations] GET pour userId: ${userId}, countOnly: ${countOnly}`);

    if (countOnly) {
      const count = await getPendingTasksCount(userId);
      return NextResponse.json({
        success: true,
        data: { count },
      });
    }

    const tasks = await getTasksToValidate(userId);

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error: unknown) {
    logger.error('[API /task-validations] Erreur GET:', error);
    return handleApiError(error, 'task-validations');
  }
}

/**
 * POST /api/gamification/task-validations
 * Valide ou invalide une tâche
 * Body: { validationId: string, completed: boolean, notes?: string }
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
    const { validationId, completed, notes } = body;

    if (!validationId || completed === undefined) {
      return NextResponse.json(
        {
          error: 'Les champs "validationId" et "completed" sont requis',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    logger.debug(
      `[API /task-validations] POST pour userId: ${userId}, validationId: ${validationId}, completed: ${completed}`
    );

    await validateTask(userId, validationId, completed, notes);

    return NextResponse.json({
      success: true,
      message: `Tâche ${completed ? 'validée' : 'invalidée'} avec succès`,
    });
  } catch (error: unknown) {
    logger.error('[API /task-validations] Erreur POST:', error);
    return handleApiError(error, 'task-validations');
  }
}

/**
 * DELETE /api/gamification/task-validations
 * Ignore une tâche (dismiss)
 * Query params: validationId
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;
    const { searchParams } = new URL(req.url);
    const validationId = searchParams.get('validationId');

    if (!validationId) {
      return NextResponse.json(
        {
          error: 'Le paramètre "validationId" est requis',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    logger.debug(`[API /task-validations] DELETE pour userId: ${userId}, validationId: ${validationId}`);

    await dismissTask(userId, validationId);

    return NextResponse.json({
      success: true,
      message: 'Tâche ignorée',
    });
  } catch (error: unknown) {
    logger.error('[API /task-validations] Erreur DELETE:', error);
    return handleApiError(error, 'task-validations');
  }
}

