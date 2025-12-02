import { getCalendarClient } from "./oauth-client";

// Type pour les requêtes à l'API Google Calendar
export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: "email" | "popup"; minutes: number }>;
  };
  conferenceData?: any;
}

/**
 * Crée un événement dans le calendrier Google de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param event - Données de l'événement à créer
 * @returns Événement créé avec toutes ses propriétés
 */
export async function createCalendarEvent(
  userId: string,
  event: GoogleCalendarEventInput
) {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: event.conferenceData ? 1 : undefined,
    sendUpdates: event.attendees && event.attendees.length > 0 ? "all" : "none",
  });

  return response.data;
}

