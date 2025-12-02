import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { addGoogleMeetToEvent } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";

/**
 * Outil pour ajouter Google Meet à un événement
 */
export const addMeetToEventTool = tool(
  async (input, config) => {
    try {
      const userId = validateUserId(config);

      const updatedEvent = await addGoogleMeetToEvent(
        userId,
        input.eventId
      );

      return JSON.stringify({
        success: true,
        meetLink: updatedEvent.conferenceData?.entryPoints?.[0]?.uri,
        message: "Lien Google Meet ajouté à l'événement",
      });
    } catch (error: any) {
      return handleToolError(
        error,
        "addMeetToEventTool",
        "Erreur lors de l'ajout de Google Meet"
      );
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

