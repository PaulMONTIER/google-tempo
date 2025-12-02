import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { deleteCalendarEvent } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";

/**
 * Outil pour supprimer un événement du calendrier Google
 */
export const deleteEventTool = tool(
  async (input, config) => {
    try {
      const userId = validateUserId(config);

      logger.debug(`🗑️ Agent deleting event ${input.eventId} for User ${userId}`);

      await deleteCalendarEvent(userId, input.eventId);

      const toolOutput = JSON.stringify({
        success: true,
        eventId: input.eventId,
        message: `Événement supprimé avec succès`,
      });

      logger.debug(`\n🗑️ [deleteEventTool] Exécution terminée`);
      logger.debug(`   User: ${userId}`);
      logger.debug(`   Event supprimé: ${input.eventId}`);
      logger.debug(`   📦 Output vers LLM: ${toolOutput}`);

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

