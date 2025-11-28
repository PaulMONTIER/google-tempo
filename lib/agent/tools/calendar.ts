import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { calendarHelpers } from "@/lib/actions/calendar-helpers";

/**
 * Outil pour rechercher des créneaux libres dans le calendrier Google
 */
export const findFreeSlotsTool = tool(
  async (input, config) => {
    try {
      // Récupérer le userId depuis la configuration (injecté par l'API)
      const userId = config?.configurable?.userId;
      
      if (!userId) {
        return JSON.stringify({
          error: "Configuration utilisateur manquante. Veuillez vous reconnecter.",
          success: false
        });
      }

      const slots = await calendarHelpers.findFreeSlots(
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
      console.log(`\n🔍 [findFreeSlotsTool] Exécution terminée`);
      console.log(`   User: ${userId}`);
      console.log(`   Duration: ${input.durationMinutes} min`);
      console.log(`   Résultats: ${slots.length} créneaux trouvés`);
      console.log(`   📦 Output vers LLM: ${toolOutput.substring(0, 200)}${toolOutput.length > 200 ? '...' : ''}`);

      return toolOutput;
    } catch (error: any) {
      console.error("[findFreeSlotsTool] Error:", error);
      
      // Gérer les erreurs OAuth
      if (error.code === "REAUTH_REQUIRED") {
        return JSON.stringify({
          error: "Votre session Google a expiré. Veuillez vous reconnecter pour accéder à votre calendrier.",
          success: false,
          requiresReauth: true
        });
      }

      return JSON.stringify({
        error: `Impossible de consulter votre calendrier : ${error.message}`,
        success: false
      });
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

/**
 * Outil pour créer un événement dans le calendrier Google
 */
export const createEventTool = tool(
  async (input, config) => {
    try {
      const userId = config?.configurable?.userId;
      
      if (!userId) {
        return JSON.stringify({
          error: "Configuration utilisateur manquante. Veuillez vous reconnecter.",
          success: false
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
          overrides: [{ method: "popup", minutes: 15 }],
        },
      };

      const event = await calendarHelpers.createEvent(userId, eventPayload);

      const toolOutput = JSON.stringify({
        success: true,
        event,
        message: `Événement \"${event.summary}\" créé avec succès`,
      });

      // 🔍 DEBUG: Ce que l'outil renvoie au LLM
      console.log(`\n🎯 [createEventTool] Exécution terminée`);
      console.log(`   User: ${userId}`);
      console.log(`   Event créé: ${event.summary}`);
      console.log(`   📦 Output vers LLM: ${toolOutput.substring(0, 200)}${toolOutput.length > 200 ? '...' : ''}`);

      return toolOutput;

    } catch (error: any) {
      console.error("[createEventTool] Error:", error);
      
      if (error.code === "REAUTH_REQUIRED") {
        return JSON.stringify({
          error: "Votre session Google a expiré. Veuillez vous reconnecter.",
          success: false,
          requiresReauth: true
        });
      }

      return JSON.stringify({
        error: `Impossible de créer l'événement : ${error.message}`,
        success: false
      });
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

/**
 * Outil pour lire les événements existants dans le calendrier Google
 */
export const getEventsTool = tool(
  async (input, config) => {
    try {
      const userId = config?.configurable?.userId;
      
      if (!userId) {
        return "Erreur : Utilisateur non identifié. Veuillez vous reconnecter.";
      }

      console.log(`👓 Agent reading events for User ${userId}`);

      // Définir la plage de dates
      const start = input.startDate ? new Date(input.startDate) : new Date();
      const end = input.endDate 
        ? new Date(input.endDate) 
        : new Date(new Date().setDate(new Date().getDate() + 1)); // +1 jour par défaut

      const events = await calendarHelpers.listEvents(userId, {
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
      console.log(`\n👓 [getEventsTool] Exécution terminée`);
      console.log(`   User: ${userId}`);
      console.log(`   Période: ${start.toLocaleDateString('fr-FR')} → ${end.toLocaleDateString('fr-FR')}`);
      console.log(`   Résultats: ${events.length} événements trouvés`);
      console.log(`   📦 Output vers LLM: ${toolOutput.substring(0, 200)}${toolOutput.length > 200 ? '...' : ''}`);

      return toolOutput;

    } catch (error: any) {
      console.error("[getEventsTool] Error:", error);
      
      if (error.code === "REAUTH_REQUIRED") {
        return "Votre session Google a expiré. Veuillez vous reconnecter pour accéder à votre calendrier.";
      }

      return `Erreur lors de la lecture du calendrier : ${error.message}`;
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

/**
 * Outil pour ajouter Google Meet à un événement
 */
export const addMeetToEventTool = tool(
  async (input, config) => {
    try {
      const userId = config?.configurable?.userId;
      
      if (!userId) {
        return JSON.stringify({
          error: "Configuration utilisateur manquante.",
          success: false
        });
      }

      const updatedEvent = await calendarHelpers.addGoogleMeetToEvent(
        userId,
        input.eventId
      );

      return JSON.stringify({
        success: true,
        meetLink: updatedEvent.conferenceData?.entryPoints?.[0]?.uri,
        message: "Lien Google Meet ajouté à l'événement",
      });

    } catch (error: any) {
      return JSON.stringify({
        error: `Erreur : ${error.message}`,
        success: false
      });
    }
  },
  {
    name: "add_google_meet",
    description: "Ajoute un lien Google Meet à un événement existant",
    schema: z.object({
      eventId: z.string().describe("ID de l'événement auquel ajouter Google Meet")
    })
  }
);

/**
 * Outil pour supprimer un événement du calendrier Google
 */
export const deleteEventTool = tool(
  async (input, config) => {
    try {
      const userId = config?.configurable?.userId;

      if (!userId) {
        return JSON.stringify({
          error: "Configuration utilisateur manquante. Veuillez vous reconnecter.",
          success: false
        });
      }

      console.log(`🗑️ Agent deleting event ${input.eventId} for User ${userId}`);

      await calendarHelpers.deleteEvent(userId, input.eventId);

      const toolOutput = JSON.stringify({
        success: true,
        eventId: input.eventId,
        message: `Événement supprimé avec succès`,
      });

      console.log(`\n🗑️ [deleteEventTool] Exécution terminée`);
      console.log(`   User: ${userId}`);
      console.log(`   Event supprimé: ${input.eventId}`);
      console.log(`   📦 Output vers LLM: ${toolOutput}`);

      return toolOutput;

    } catch (error: any) {
      console.error("[deleteEventTool] Error:", error);

      if (error.code === "REAUTH_REQUIRED") {
        return JSON.stringify({
          error: "Votre session Google a expiré. Veuillez vous reconnecter.",
          success: false,
          requiresReauth: true
        });
      }

      return JSON.stringify({
        error: `Impossible de supprimer l'événement : ${error.message}`,
        success: false
      });
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

