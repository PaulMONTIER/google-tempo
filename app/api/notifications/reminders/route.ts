import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { getRemindersForUser, markReminderAsSent } from '@/lib/gamification/reminder-service';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/notifications/reminders
 * Récupère les rappels actifs pour l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;

    logger.debug(`[API /notifications/reminders] GET pour userId: ${userId}`);

    const reminders = await getRemindersForUser(userId);

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error: unknown) {
    logger.error('[API /notifications/reminders] Erreur GET:', error);
    return handleApiError(error, 'notifications-reminders');
  }
}

/**
 * POST /api/notifications/reminders
 * Marque un rappel comme vu/envoyé
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
    const { eventId, reminderDay } = body;

    if (!eventId || reminderDay === undefined) {
      return NextResponse.json(
        {
          error: 'Les champs "eventId" et "reminderDay" sont requis',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    logger.debug(`[API /notifications/reminders] POST pour userId: ${userId}, eventId: ${eventId}, reminderDay: ${reminderDay}`);

    await markReminderAsSent(userId, eventId, reminderDay);

    return NextResponse.json({
      success: true,
      message: 'Rappel marqué comme envoyé',
    });
  } catch (error: unknown) {
    logger.error('[API /notifications/reminders] Erreur POST:', error);
    return handleApiError(error, 'notifications-reminders');
  }
}

