import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { deleteCalendarEvent, listCalendarEvents } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarEvent } from "@/types";

/**
 * Formate une date ISO en format lisible français
 */
function formatDateTimeFr(isoString: string): string {
  try {
    const date = new Date(isoString);
    return format(date, "EEEE d MMMM 'à' HH:mm", { locale: fr });
  } catch {
    return isoString;
  }
}

/**
 * Outil pour supprimer un événement du calendrier Google
 * Selon le paramètre requireConfirmation dans la config :
 * - true (défaut) : retourne un pending_event pour confirmation humaine
 * - false : supprime directement l'événement
 */
export const deleteEventTool = tool(
  async (input, config) => {
    try {
      const userId = validateUserId(config);
      const requireConfirmation = config?.configurable?.requireConfirmation ?? true;

      // 🔍 DEBUG
      logger.debug(`\n🔧 [deleteEventTool] Config reçue:`);
      logger.debug(`   requireConfirmation: ${requireConfirmation}`);
      logger.debug(`   eventId: ${input.eventId}`);

      // Récupérer les détails de l'événement pour l'affichage
      // On cherche les événements récents et futurs
      const now = new Date();
      const events = await listCalendarEvents(userId, {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // -30 jours
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // +1 an
        maxResults: 500, // Augmenter le nombre de résultats
      });

      logger.debug(`   Événements trouvés dans la période: ${events.length}`);
      const eventToDelete = events.find((e: CalendarEvent) => e.id === input.eventId);

      if (!eventToDelete) {
        return JSON.stringify({
          success: false,
          error: `Événement non trouvé avec l'ID: ${input.eventId}`,
        });
      }

      // 🔄 Mode DIRECT : suppression immédiate
      if (!requireConfirmation) {
        logger.debug(`🗑️ Agent deleting event ${input.eventId} for User ${userId}`);
        await deleteCalendarEvent(userId, input.eventId);

        // 🌳 SYNC ARBRES : Supprimer l'arbre ou la branche associée
        try {
          const { treeService } = await import('@/lib/services/tree-service');
          // On essaie de supprimer en tant qu'objectif (supprime tout l'arbre)
          await treeService.deleteTreeByGoalEventId(input.eventId);
          // On essaie de supprimer en tant que branche (supprime juste l'étape)
          await treeService.deleteBranchByEventId(input.eventId);
        } catch (error) {
          logger.warn('[deleteEventTool] ⚠️ Failed to sync tree deletion:', error);
        }

        return JSON.stringify({
          success: true,
          eventId: input.eventId,
          message: `Événement "${eventToDelete.title}" supprimé avec succès`,
        });
      }

      // 🔄 Mode PREVIEW : demande de confirmation
      const pendingId = `pending-delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startFormatted = formatDateTimeFr(eventToDelete.startDate.toISOString());

      const confirmMessage = `Je propose de supprimer l'événement "${eventToDelete.title}" prévu ${startFormatted}. Confirmez-vous la suppression ?`;

      const toolOutput = JSON.stringify({
        type: "pending_event",
        actionType: "delete", // 🆕 Type d'action
        eventId: input.eventId, // 🆕 ID de l'événement existant
        event: {
          id: pendingId,
          title: eventToDelete.title,
          startDateTime: eventToDelete.startDate.toISOString(),
          endDateTime: eventToDelete.endDate.toISOString(),
          description: eventToDelete.description,
          location: eventToDelete.location,
        },
        message: confirmMessage,
      });

      logger.debug(`\n🗑️ [deleteEventTool] Mode PREVIEW - En attente de confirmation`);
      logger.debug(`   Pending ID: ${pendingId}`);
      logger.debug(`   Event à supprimer: ${eventToDelete.title}`);

      return toolOutput;
    } catch (error: any) {
      return handleToolError(
        error,
        "deleteEventTool",
        "Impossible de supprimer l'événement"
      );
    }
  },
  {
    name: "delete_calendar_event",
    description: "Supprime un événement du calendrier Google. Nécessite l'ID de l'événement obtenu via get_calendar_events.",
    schema: z.object({
      eventId: z.string().describe("ID de l'événement à supprimer (obtenu via get_calendar_events)")
    })
  }
);
