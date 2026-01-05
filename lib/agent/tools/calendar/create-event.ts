import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createCalendarEvent } from "@/lib/calendar";
import { logger } from "@/lib/utils/logger";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
 * Outil pour créer un événement dans le calendrier Google
 * Selon le paramètre requireConfirmation dans la config :
 * - true (défaut) : retourne un pending_event pour confirmation humaine
 * - false : crée directement l'événement
 */
export const createEventTool = tool(
  async (input, config) => {
    try {
      // Lire le setting depuis la config
      const requireConfirmation = config?.configurable?.requireConfirmation ?? true;
      const userId = config?.configurable?.userId;

      // 🔍 DEBUG: Vérifier la config reçue
      logger.debug(`\n🔧 [createEventTool] Config reçue:`);
      logger.debug(`   requireConfirmation: ${requireConfirmation}`);
      logger.debug(`   userId: ${userId}`);
      logger.debug(`   config.configurable: ${JSON.stringify(config?.configurable)}`);

      // 🔄 Mode DIRECT : création immédiate (sans confirmation)
      // On crée directement si :
      // 1. L'utilisateur a désactivé la confirmation (requireConfirmation === false)
      // 2. OU l'agent force la confirmation car l'utilisateur a déjà validé (input.autoConfirm === true)
      if (!requireConfirmation || input.autoConfirm) {
        if (!userId) {
          return JSON.stringify({
            success: false,
            error: "userId manquant dans la configuration",
          });
        }

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
            overrides: [{ method: "popup" as const, minutes: 15 }],
          },
        };

        const event = await createCalendarEvent(userId, eventPayload);

        // Ajouter XP pour création de tâche
        try {
          const { addXP } = await import('@/lib/gamification/progress-service');
          const { XP_REWARDS } = await import('@/lib/gamification/config/xp-config');
          await addXP(userId, XP_REWARDS.TASK_CREATED, 'task_created', event.id ?? undefined);
        } catch (error) {
          logger.warn('Failed to add XP for task creation:', error);
        }

        // Note: Les arbres de préparation sont créés via l'outil dédié 'create_preparation_tree'
        // Les événements simples ne créent pas d'arbre automatiquement

        const toolOutput = JSON.stringify({
          success: true,
          event,
          message: `Événement "${event.summary}" créé avec succès`,
        });

        logger.debug(`\n🎯 [createEventTool] Mode DIRECT - Création immédiate`);
        logger.debug(`   User: ${userId}`);
        logger.debug(`   Event créé: ${event.summary}`);

        return toolOutput;
      }

      // 🔄 Mode PREVIEW : demande de confirmation
      const pendingId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startFormatted = formatDateTimeFr(input.startDateTime);

      let confirmMessage = `Je propose de créer l'événement "${input.title}" ${startFormatted}.`;

      if (input.location) {
        confirmMessage += ` Lieu : ${input.location}.`;
      }

      if (input.attendees && input.attendees.length > 0) {
        confirmMessage += ` Participants : ${input.attendees.join(", ")}.`;
      }

      confirmMessage += " Confirmez-vous la création ?";

      const toolOutput = JSON.stringify({
        type: "pending_event",
        actionType: "create", // 🆕 Type d'action
        event: {
          id: pendingId,
          title: input.title,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          description: input.description,
          location: input.location,
          attendees: input.attendees,
        },
        message: confirmMessage,
      });

      logger.debug(`\n🎯 [createEventTool] Mode PREVIEW - En attente de confirmation`);
      logger.debug(`   Pending ID: ${pendingId}`);
      logger.debug(`   Event proposé: ${input.title}`);

      return toolOutput;
    } catch (error: any) {
      logger.error("[createEventTool] Erreur:", error);
      return JSON.stringify({
        success: false,
        error: "Impossible de créer l'événement: " + error.message,
      });
    }
  },
  {
    name: "create_calendar_event",
    description: "Crée ou propose un événement dans le calendrier Google. Selon les préférences utilisateur, demande confirmation ou crée directement.",
    schema: z.object({
      title: z.string().describe("Titre de l'événement (ex: 'Réunion avec Pierre')"),
      startDateTime: z.string().describe("Date et heure de début au format ISO 8601 (ex: 2024-01-15T14:00:00)"),
      endDateTime: z.string().describe("Date et heure de fin au format ISO 8601 (ex: 2024-01-15T15:00:00)"),
      description: z.string().optional().describe("Description détaillée de l'événement"),
      location: z.string().optional().describe("Lieu de l'événement (adresse ou lieu)"),
      attendees: z.array(z.string()).optional().describe("Liste des emails des participants"),
      autoConfirm: z.boolean().optional().describe("Si true, force la création immédiate sans demander confirmation UI")
    })
  }
);

