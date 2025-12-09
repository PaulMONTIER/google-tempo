import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { deleteCalendarEvent, listCalendarEvents } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";
import { CalendarEvent } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function formatDateFr(date: Date): string {
    return format(date, "EEEE d MMMM 'à' HH:mm", { locale: fr });
}

/**
 * Outil pour supprimer plusieurs événements en batch
 */
export const batchDeleteTool = tool(
    async (input, config) => {
        try {
            const userId = validateUserId(config);
            const requireConfirmation = config?.configurable?.requireConfirmation ?? true;

            logger.debug(`\n🗑️ [batchDeleteTool] Deleting ${input.eventIds.length} events`);

            if (input.eventIds.length === 0) {
                return JSON.stringify({ success: false, error: "Aucun ID fourni" });
            }

            // Récupérer les événements
            const now = new Date();
            const allEvents = await listCalendarEvents(userId, {
                startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
                maxResults: 500,
            });

            const toDelete = allEvents.filter((e: CalendarEvent) =>
                input.eventIds.includes(e.id)
            );

            if (toDelete.length === 0) {
                return JSON.stringify({ success: false, error: "Événements non trouvés" });
            }

            // Mode confirmation
            if (requireConfirmation) {
                const list = toDelete
                    .map((e: CalendarEvent) => `• "${e.title}" - ${formatDateFr(new Date(e.startDate))}`)
                    .join("\n");

                return JSON.stringify({
                    type: "pending_batch_event",
                    actionType: "batch_delete",
                    eventIds: toDelete.map((e: CalendarEvent) => e.id),
                    message: `Je propose de supprimer ${toDelete.length} événement(s) :\n${list}`,
                    count: toDelete.length,
                });
            }

            // Suppression directe
            const deleted: string[] = [];
            for (const event of toDelete) {
                await deleteCalendarEvent(userId, event.id);
                deleted.push(event.id);
            }

            return JSON.stringify({
                success: true,
                deleted,
                message: `✅ ${deleted.length} événement(s) supprimé(s)`,
            });
        } catch (error: any) {
            return handleToolError(error, "batchDeleteTool", "Erreur suppression batch");
        }
    },
    {
        name: "batch_delete_events",
        description: "Supprime plusieurs événements. Utiliser après filter_calendar_events.",
        schema: z.object({
            eventIds: z.array(z.string()).describe("Liste des IDs à supprimer"),
        })
    }
);
