import { getCalendarClient } from "./oauth-client";

/**
 * Supprime un événement du calendrier Google de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param eventId - ID de l'événement à supprimer
 * @returns Objet de confirmation avec success et eventId
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<{ success: boolean; eventId: string }> {
  const calendar = await getCalendarClient(userId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  });

  return { success: true, eventId };
}

