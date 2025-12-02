import { getCalendarClient } from "./oauth-client";
import type { GoogleCalendarEventInput } from "./create-event";

/**
 * Ajoute les données Google Meet à un événement (fonction pure)
 * @param event - Événement auquel ajouter Google Meet
 * @returns Événement avec les données Google Meet ajoutées
 */
export function addGoogleMeet(
  event: GoogleCalendarEventInput
): GoogleCalendarEventInput {
  return {
    ...event,
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };
}

/**
 * Ajoute un lien Google Meet à un événement existant dans le calendrier
 * @param userId - ID de l'utilisateur
 * @param eventId - ID de l'événement auquel ajouter Google Meet
 * @returns Événement mis à jour avec le lien Google Meet
 */
export async function addGoogleMeetToEvent(
  userId: string,
  eventId: string
) {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    conferenceDataVersion: 1,
    requestBody: {
      conferenceData: {
        createRequest: {
          conferenceSolutionKey: { type: "hangoutsMeet" },
          requestId: `meet-${Date.now()}`,
        },
      },
    },
  });

  return response.data;
}

