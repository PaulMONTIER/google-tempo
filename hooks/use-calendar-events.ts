import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '@/types';

/**
 * Hook pour gérer le chargement et le rafraîchissement des événements du calendrier
 * @param isAuthenticated - Indique si l'utilisateur est authentifié
 * @returns Objet contenant les événements, fonctions de refresh et état de chargement
 */
export function useCalendarEvents(isAuthenticated: boolean) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCalendarEvents = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      } else {
        const error = new Error(`Failed to fetch calendar events: ${res.status}`);
        setError(error);
        console.error('Failed to fetch calendar events:', res.status);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error fetching calendar events');
      setError(error);
      console.error('Error fetching calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Charger les événements automatiquement à l'authentification
  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendarEvents();
    } else {
      setEvents([]);
    }
  }, [isAuthenticated, fetchCalendarEvents]);

  return {
    events,
    refreshEvents: fetchCalendarEvents,
    isLoading,
    error,
  };
}

