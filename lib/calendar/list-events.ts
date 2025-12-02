import { getCalendarClient } from "./oauth-client";
import type { CalendarEvent } from "@/types";

export interface ListEventsOptions {
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
}

/**
 * Récupère la liste des événements du calendrier principal de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param options - Options de filtrage (dates, nombre max de résultats)
 * @returns Liste des événements formatés
 */
export async function listCalendarEvents(
  userId: string,
  options: ListEventsOptions = {}
): Promise<CalendarEvent[]> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: (options.startDate || new Date()).toISOString(),
      timeMax: options.endDate?.toISOString(),
      maxResults: options.maxResults || 250,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.data.items || []).map((event): CalendarEvent => ({
      id: event.id || Math.random().toString(),
      title: event.summary || "(Sans titre)",
      startDate: new Date(event.start?.dateTime || event.start?.date || new Date()),
      endDate: new Date(event.end?.dateTime || event.end?.date || new Date()),
      description: event.description || "",
      location: event.location || "",
      htmlLink: event.htmlLink || "",
      color: undefined,
    }));
  } catch (error) {
    console.error("❌ Erreur listEvents:", error);
    return [];
  }
}

