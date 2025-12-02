import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { findFreeCalendarSlots } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";

/**
 * Outil pour rechercher des créneaux libres dans le calendrier Google
 */
export const findFreeSlotsTool = tool(
  async (input, config) => {
    try {
      const userId = validateUserId(config);

      const slots = await findFreeCalendarSlots(
        userId,
        input.durationMinutes,
        {
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          workingHoursStart: input.workingHoursStart,
          workingHoursEnd: input.workingHoursEnd,
          excludeWeekends: input.excludeWeekends ?? true,
          maxSlots: 4,
        }
      );

      const toolOutput = JSON.stringify({
        success: true,
        slots,
        message: `Trouvé ${slots.length} créneaux disponibles pour ${input.durationMinutes} minutes`,
      });

      // 🔍 DEBUG: Ce que l'outil renvoie au LLM
      logger.debug(`\n🔍 [findFreeSlotsTool] Exécution terminée`);
      logger.debug(`   User: ${userId}`);
      logger.debug(`   Duration: ${input.durationMinutes} min`);
      logger.debug(`   Résultats: ${slots.length} créneaux trouvés`);
      logger.debug(`   📦 Output vers LLM: ${toolOutput.substring(0, 200)}${toolOutput.length > 200 ? '...' : ''}`);

      return toolOutput;
    } catch (error: any) {
      return handleToolError(
        error,
        "findFreeSlotsTool",
        "Impossible de consulter votre calendrier"
      );
    }
  },
  {
    name: "find_free_slots",
    description: "CRITIQUE : À appeler OBLIGATOIREMENT avant de créer un événement pour vérifier qu'il n'y a pas de conflit. Renvoie les trous libres dans le calendrier.",
    schema: z.object({
      durationMinutes: z.number().describe("Durée souhaitée en minutes (ex: 30, 60, 120)"),
      startDate: z.string().optional().describe("Date de début de recherche au format ISO 8601 (ex: 2024-01-15T09:00:00). Par défaut: maintenant"),
      endDate: z.string().optional().describe("Date de fin de recherche au format ISO 8601. Par défaut: +14 jours"),
      workingHoursStart: z.number().optional().describe("Heure de début de journée (0-23). Défaut: 9"),
      workingHoursEnd: z.number().optional().describe("Heure de fin de journée (0-23). Défaut: 18"),
      excludeWeekends: z.boolean().optional().describe("Exclure les weekends. Défaut: true")
    })
  }
);

