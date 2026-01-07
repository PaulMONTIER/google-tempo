import { getCalendarClient } from "./oauth-client";
import { GoogleCalendarEventInput } from "./create-event";

/**
 * Met à jour un événement dans le calendrier Google
 * @param userId ID de l'utilisateur
 * @param eventId ID de l'événement Google Calendar
 * @param updates Champs à mettre à jour (partiels)
 */
export async function updateCalendarEvent(
    userId: string,
    eventId: string,
    updates: Partial<GoogleCalendarEventInput>
) {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.patch({
        calendarId: "primary",
        eventId: eventId,
        requestBody: updates,
        sendUpdates: updates.attendees ? "all" : "none",
    });

    return response.data;
}
