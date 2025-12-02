import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { listCalendarEvents } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";

/**
 * Outil pour lire les événements existants dans le calendrier Google
 */
export const getEventsTool = tool(
  async (input, config) => {
    try {
      const userId = validateUserId(config);

      logger.debug(`👓 Agent reading events for User ${userId}`);

      // Définir la plage de dates
      const start = input.startDate ? new Date(input.startDate) : new Date();
      const end = input.endDate 
        ? new Date(input.endDate) 
        : new Date(new Date().setDate(new Date().getDate() + 1)); // +1 jour par défaut

      const events = await listCalendarEvents(userId, {
        startDate: start,
        endDate: end,
        maxResults: 20, // Limiter pour ne pas noyer le LLM
      });

      if (events.length === 0) {
        return "Aucun événement trouvé sur cette période.";
      }

      // Formater les événements de manière lisible pour le LLM (avec IDs pour suppression)
      const formattedEvents = events.map((e) => {
        const startStr = e.startDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        const startTime = e.startDate.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTime = e.endDate.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return `- ${e.title} : ${startStr} de ${startTime} à ${endTime}${e.location ? ` (${e.location})` : ""} [id:${e.id}]`;
      }).join("\n");

      const toolOutput = `Événements trouvés :\n${formattedEvents}`;

      // 🔍 DEBUG: Ce que l'outil renvoie au LLM
      logger.debug(`\n👓 [getEventsTool] Exécution terminée`);
      logger.debug(`   User: ${userId}`);
      logger.debug(`   Période: ${start.toLocaleDateString('fr-FR')} → ${end.toLocaleDateString('fr-FR')}`);
      logger.debug(`   Résultats: ${events.length} événements trouvés`);
      logger.debug(`   📦 Output vers LLM: ${toolOutput.substring(0, 200)}${toolOutput.length > 200 ? '...' : ''}`);

      return toolOutput;
    } catch (error: any) {
      return handleToolError(
        error,
        "getEventsTool",
        "Erreur lors de la lecture du calendrier",
        true // Retourne une string simple au lieu de JSON
      );
    }
  },
  {
    name: "get_calendar_events",
    description: "Étape 1 du raisonnement : Utiliser pour VOIR ce qui est déjà planifié avant de proposer un créneau. Essentiel pour répondre à 'Qu'est-ce que j'ai de prévu ?'",
    schema: z.object({
      startDate: z.string().optional().describe("Date de début au format ISO 8601 (ex: 2024-01-15T00:00:00). Par défaut : maintenant"),
      endDate: z.string().optional().describe("Date de fin au format ISO 8601. Par défaut : fin de la journée suivante"),
    })
  }
);

