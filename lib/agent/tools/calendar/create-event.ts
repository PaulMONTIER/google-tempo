import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createCalendarEvent } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";

/**
 * Outil pour créer un événement dans le calendrier Google
 */
export const createEventTool = tool(
  async (input, config) => {
    try {
      const userId = validateUserId(config);

      const eventPayload = {
        summary: input.title,
        description: input.description,
        start: {
          dateTime: input.startDateTime,
          timeZone: "Europe/Paris",
        },
        end: {
          dateTime: input.endDateTime,
          timeZone: "Europe/Paris",
        },
        location: input.location,
        attendees: input.attendees?.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 15 }],
        },
      };

      const event = await createCalendarEvent(userId, eventPayload);

      // Ajouter XP pour création de tâche
      try {
        const { addXP } = await import('@/lib/gamification/progress-service');
        const { XP_REWARDS } = await import('@/lib/gamification/config/xp-config');
        await addXP(userId, XP_REWARDS.TASK_CREATED, 'task_created', event.id);
      } catch (error) {
        logger.warn('Failed to add XP for task creation:', error);
        // Ne pas faire échouer la création d'événement si l'XP échoue
      }

      const toolOutput = JSON.stringify({
        success: true,
        event,
        message: `Événement \"${event.summary}\" créé avec succès`,
      });

      // 🔍 DEBUG: Ce que l'outil renvoie au LLM
      logger.debug(`\n🎯 [createEventTool] Exécution terminée`);
      logger.debug(`   User: ${userId}`);
      logger.debug(`   Event créé: ${event.summary}`);
      logger.debug(`   📦 Output vers LLM: ${toolOutput.substring(0, 200)}${toolOutput.length > 200 ? '...' : ''}`);

      return toolOutput;
    } catch (error: any) {
      return handleToolError(
        error,
        "createEventTool",
        "Impossible de créer l'événement"
      );
    }
  },
  {
    name: "create_calendar_event",
    description: "ACTION FINALE : À appeler uniquement une fois qu'un créneau libre a été identifié via find_free_slots. Crée l'événement dans le calendrier Google.",
    schema: z.object({
      title: z.string().describe("Titre de l'événement (ex: 'Réunion avec Pierre')"),
      startDateTime: z.string().describe("Date et heure de début au format ISO 8601 (ex: 2024-01-15T14:00:00)"),
      endDateTime: z.string().describe("Date et heure de fin au format ISO 8601 (ex: 2024-01-15T15:00:00)"),
      description: z.string().optional().describe("Description détaillée de l'événement"),
      location: z.string().optional().describe("Lieu de l'événement (adresse ou lieu)"),
      attendees: z.array(z.string()).optional().describe("Liste des emails des participants")
    })
  }
);

