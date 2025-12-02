// Export des types
export type { GoogleCalendarEventInput } from "./create-event";
export type { ListEventsOptions } from "./list-events";
export type { FindFreeSlotsOptions, FreeSlot } from "./find-free-slots";

// Import des fonctions pour créer l'objet de compatibilité
import { createCalendarEvent } from "./create-event";
import { listCalendarEvents } from "./list-events";
import { deleteCalendarEvent } from "./delete-event";
import { findFreeCalendarSlots } from "./find-free-slots";
import { addGoogleMeet, addGoogleMeetToEvent } from "./add-meet";

// Export des fonctions individuelles (pour usage direct)
export { createCalendarEvent } from "./create-event";
export { listCalendarEvents } from "./list-events";
export { deleteCalendarEvent } from "./delete-event";
export { findFreeCalendarSlots } from "./find-free-slots";
export { addGoogleMeet, addGoogleMeetToEvent } from "./add-meet";
export { getCalendarClient } from "./oauth-client";

// Export pour compatibilité avec l'ancienne API
// Création d'un objet qui expose les mêmes méthodes que l'ancienne classe CalendarHelpers
export const calendarHelpers = {
  createEvent: createCalendarEvent,
  listEvents: listCalendarEvents,
  deleteEvent: deleteCalendarEvent,
  findFreeSlots: findFreeCalendarSlots,
  addGoogleMeet,
  addGoogleMeetToEvent,
};

