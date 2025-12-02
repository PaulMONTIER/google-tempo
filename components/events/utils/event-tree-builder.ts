import { CalendarEvent } from '@/types';

export interface EventTree {
  main: CalendarEvent;
  children: CalendarEvent[];
}

/**
 * Construit l'arbre de dépendances d'un événement
 * @param event Événement pour lequel construire l'arbre
 * @param allEvents Liste complète des événements
 * @returns Arbre de dépendances ou null si aucune relation
 */
export function buildEventTree(
  event: CalendarEvent,
  allEvents: CalendarEvent[]
): EventTree | null {
  if (!event.parentEventId && !allEvents.some(e => e.parentEventId === event.id)) {
    return null; // Pas de relations
  }

  // Trouver l'événement principal (racine)
  let mainEvent = event;
  if (event.parentEventId) {
    mainEvent = allEvents.find(e => e.id === event.parentEventId) || event;
  }

  // Trouver tous les événements enfants
  const childEvents = allEvents
    .filter(e => e.parentEventId === mainEvent.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    main: mainEvent,
    children: childEvents,
  };
}

