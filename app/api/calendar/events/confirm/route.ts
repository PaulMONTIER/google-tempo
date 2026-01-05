import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/api/session-service";
import { validateSession } from "@/lib/api/validators/session-validator";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/calendar";
import { handleApiError } from "@/lib/api/error-handler";
import { logger } from "@/lib/utils/logger";
import { ConfirmEventRequest } from "@/types";

/**
 * API pour confirmer et exécuter une action en attente (création ou suppression)
 */
export async function POST(req: NextRequest) {
    try {
        // Validation de la session
        const session = await getAppSession();
        const validation = validateSession(session);

        if (validation.error) {
            return validation.error;
        }

        const userId = validation.userId;
        const body: ConfirmEventRequest = await req.json();
        const { event, action, actionType = 'create', eventId, rejectionReason, modifiedEvent } = body;

        logger.info(`[API /confirm] Action: ${action}, ActionType: ${actionType}, Event: ${event.title}`);

        // Action: ACCEPTER
        if (action === 'accept') {
            // 🆕 Suppression BATCH
            if (actionType === 'batch_delete' && body.eventIds && Array.isArray(body.eventIds)) {
                const eventIds = body.eventIds as string[];
                const results = { deleted: 0, failed: 0 };

                for (const id of eventIds) {
                    try {
                        await deleteCalendarEvent(userId, id);
                        results.deleted++;
                    } catch (error) {
                        logger.warn(`[API /confirm] Failed to delete event ${id}:`, error);
                        results.failed++;
                    }
                }

                logger.info(`[API /confirm] 🗑️ Batch delete: ${results.deleted} supprimés, ${results.failed} échecs`);

                return NextResponse.json({
                    success: true,
                    action: 'batch_delete',
                    deleted: results.deleted,
                    failed: results.failed,
                    message: `${results.deleted} événement(s) supprimé(s) avec succès.`,
                });
            }

            // 🆕 Suppression simple
            if (actionType === 'delete' && eventId) {
                await deleteCalendarEvent(userId, eventId);

                logger.info(`[API /confirm] 🗑️ Event supprimé: ${event.title}`);

                return NextResponse.json({
                    success: true,
                    action: 'delete',
                    message: `L'événement "${event.title}" a été supprimé avec succès.`,
                });
            }

            // 🆕 Création (comportement par défaut)
            const eventToCreate = modifiedEvent ? { ...event, ...modifiedEvent } : event;

            const eventPayload = {
                summary: eventToCreate.title,
                description: eventToCreate.description,
                start: {
                    dateTime: eventToCreate.startDateTime,
                    timeZone: "Europe/Paris",
                },
                end: {
                    dateTime: eventToCreate.endDateTime,
                    timeZone: "Europe/Paris",
                },
                location: eventToCreate.location,
                attendees: eventToCreate.attendees?.map((email: string) => ({ email })),
                reminders: {
                    useDefault: false,
                    overrides: [{ method: "popup" as const, minutes: 15 }],
                },
            };

            const createdEvent = await createCalendarEvent(userId, eventPayload);

            // Ajouter XP pour création de tâche
            try {
                const { addXP } = await import('@/lib/gamification/progress-service');
                const { XP_REWARDS } = await import('@/lib/gamification/config/xp-config');
                await addXP(userId, XP_REWARDS.TASK_CREATED, 'task_created', createdEvent.id ?? undefined);
            } catch (error) {
                logger.warn('Failed to add XP for task creation:', error);
            }

            logger.info(`[API /confirm] ✅ Event créé: ${createdEvent.summary}`);

            return NextResponse.json({
                success: true,
                event: createdEvent,
                message: `L'événement "${createdEvent.summary}" a été créé avec succès.`,
            });
        }

        // Action: MODIFIER (retourne l'événement pour édition, puis un nouvel appel avec accept)
        if (action === 'modify') {
            return NextResponse.json({
                success: true,
                action: 'modify',
                event,
                message: 'Événement en cours de modification.',
            });
        }

        // Action: REFUSER
        if (action === 'reject') {
            const actionLabel = actionType === 'delete' ? 'suppression' : 'création';
            logger.info(`[API /confirm] ❌ ${actionLabel} refusée. Raison: ${rejectionReason || 'non spécifiée'}`);

            return NextResponse.json({
                success: true,
                action: 'reject',
                message: `La ${actionLabel} a été annulée.`,
                // Si une raison est fournie, on génère un prompt pour que l'agent propose une alternative
                nextPrompt: rejectionReason
                    ? `L'utilisateur a refusé la ${actionLabel} précédente. Raison : "${rejectionReason}". Propose une alternative en tenant compte de ce feedback.`
                    : null,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Action non reconnue. Utilisez accept, modify ou reject.' },
            { status: 400 }
        );

    } catch (error) {
        logger.error('[API /confirm] Erreur:', error);
        return handleApiError(error, 'confirm-event');
    }
}
