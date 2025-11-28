import { google } from "googleapis";

import { tokenManager } from "@/lib/auth/token-manager";

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

class CalendarHelpers {
  async createEvent(userId: string, event: GoogleCalendarEventInput) {
    const { accessToken } = await tokenManager.getValidAccessToken(userId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: event.conferenceData ? 1 : undefined,
      sendUpdates: event.attendees && event.attendees.length > 0 ? "all" : "none",
    });

    return response.data;
  }

  addGoogleMeet(event: GoogleCalendarEventInput): GoogleCalendarEventInput {
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

  async addGoogleMeetToEvent(userId: string, eventId: string) {
    const { accessToken } = await tokenManager.getValidAccessToken(userId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

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

  /**
   * Supprime un événement du calendrier Google
   */
  async deleteEvent(userId: string, eventId: string) {
    const { accessToken } = await tokenManager.getValidAccessToken(userId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });

    return { success: true, eventId };
  }

  /**
   * Récupère la liste des événements du calendrier principal
   */
  async listEvents(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      maxResults?: number;
    } = {}
  ) {
    try {
      const { accessToken } = await tokenManager.getValidAccessToken(userId);
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: (options.startDate || new Date()).toISOString(),
        timeMax: options.endDate?.toISOString(),
        maxResults: options.maxResults || 250,
        singleEvents: true,
        orderBy: "startTime",
      });

      return (response.data.items || []).map((event) => ({
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

  async findFreeSlots(
    userId: string,
    durationMinutes: number,
    options: {
      startDate?: Date;
      endDate?: Date;
      workingHoursStart?: number;
      workingHoursEnd?: number;
      excludeWeekends?: boolean;
      maxSlots?: number;
    } = {}
  ) {
    const {
      startDate = new Date(),
      endDate = this.addDays(new Date(), 14),
      workingHoursStart = 9,
      workingHoursEnd = 18,
      excludeWeekends = true,
      maxSlots = 4,
    } = options;

    const { accessToken } = await tokenManager.getValidAccessToken(userId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: "primary" }],
        timeZone: "Europe/Paris",
      },
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    const candidateSlots: Array<{ start: Date; end: Date }> = [];

    let currentDate = new Date(startDate);
    const minutes = currentDate.getMinutes();
    if (minutes !== 0 && minutes !== 30) {
      const nextSlotMinutes = minutes < 30 ? 30 : 60;
      currentDate.setMinutes(nextSlotMinutes === 60 ? 0 : nextSlotMinutes, 0, 0);
      if (nextSlotMinutes === 60) {
        currentDate.setHours(currentDate.getHours() + 1);
      }
    }

    while (currentDate < endDate && candidateSlots.length < maxSlots * 10) {
      const dayOfWeek = currentDate.getDay();
      if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        currentDate = this.addDays(currentDate, 1);
        currentDate.setHours(workingHoursStart, 0, 0, 0);
        continue;
      }

      const hour = currentDate.getHours();
      if (hour < workingHoursStart || hour >= workingHoursEnd) {
        if (hour >= workingHoursEnd) {
          currentDate = this.addDays(currentDate, 1);
          currentDate.setHours(workingHoursStart, 0, 0, 0);
        } else {
          currentDate.setHours(workingHoursStart, 0, 0, 0);
        }
        continue;
      }

      const slotEnd = new Date(currentDate.getTime() + durationMinutes * 60 * 1000);
      if (slotEnd.getHours() > workingHoursEnd) {
        currentDate = this.addDays(currentDate, 1);
        currentDate.setHours(workingHoursStart, 0, 0, 0);
        continue;
      }

      candidateSlots.push({ start: new Date(currentDate), end: slotEnd });
      currentDate = new Date(currentDate.getTime() + 30 * 60 * 1000);
    }

    const freeSlots = candidateSlots.filter((slot) => {
      return !busySlots.some((busy) => {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);
        return slot.start < busyEnd && slot.end > busyStart;
      });
    });

    return freeSlots.slice(0, maxSlots).map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      label: this.formatSlotLabel(slot.start),
    }));
  }

  addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  formatSlotLabel(date: Date) {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
}

export const calendarHelpers = new CalendarHelpers();
