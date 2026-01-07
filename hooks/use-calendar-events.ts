import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/types';

/**
 * Hook pour gérer le chargement et le rafraîchissement des événements du calendrier
 * Supporte les optimistic updates pour une meilleure UX
 * 
 * @param isAuthenticated - Indique si l'utilisateur est authentifié
 * @returns Objet contenant les événements, fonctions de refresh et état de chargement
 */
export function useCalendarEvents(isAuthenticated: boolean) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pendingUpdatesRef = useRef<Map<string, CalendarEvent>>(new Map());

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
        // Fusionner les événements du serveur avec les mises à jour optimistes en attente
        const serverEvents = data.events;
        const pendingEvents = Array.from(pendingUpdatesRef.current.values());

        // Combiner : remplacer les events serveur par les pending si même ID
        const mergedEvents = serverEvents.map((event: CalendarEvent) => {
          const pending = pendingUpdatesRef.current.get(event.id);
          return pending || event;
        });

        // Ajouter les nouveaux events (qui n'existent pas encore côté serveur)
        const newPendingEvents = pendingEvents.filter(
          pe => !serverEvents.some((se: CalendarEvent) => se.id === pe.id)
        );

        setEvents([...mergedEvents, ...newPendingEvents]);
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

  /**
   * Ajoute un événement de manière optimiste (avant confirmation serveur)
   */
  const addEventOptimistic = useCallback((event: CalendarEvent) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticEvent = { ...event, id: tempId };

    pendingUpdatesRef.current.set(tempId, optimisticEvent);
    setEvents(prev => [...prev, optimisticEvent]);

    return tempId;
  }, []);

  /**
   * Met à jour un événement de manière optimiste
   */
  const updateEventOptimistic = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const updated = { ...event, ...updates };
        pendingUpdatesRef.current.set(eventId, updated);
        return updated;
      }
      return event;
    }));
  }, []);

  /**
   * Supprime un événement de manière optimiste
   */
  const removeEventOptimistic = useCallback((eventId: string) => {
    pendingUpdatesRef.current.delete(eventId);
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  /**
   * Confirme une mise à jour optimiste (après succès serveur)
   * Remplace l'ID temporaire par l'ID réel du serveur
   */
  const confirmOptimisticUpdate = useCallback((tempId: string, realId?: string) => {
    const pending = pendingUpdatesRef.current.get(tempId);
    pendingUpdatesRef.current.delete(tempId);

    if (realId && pending) {
      setEvents(prev => prev.map(event =>
        event.id === tempId ? { ...pending, id: realId } : event
      ));
    }
  }, []);

  /**
   * Annule une mise à jour optimiste (en cas d'erreur)
   */
  const rollbackOptimisticUpdate = useCallback((tempId: string) => {
    pendingUpdatesRef.current.delete(tempId);
    setEvents(prev => prev.filter(event => event.id !== tempId));
  }, []);

  // Charger les événements automatiquement à l'authentification
  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendarEvents();
    } else {
      setEvents([]);
      pendingUpdatesRef.current.clear();
    }
  }, [isAuthenticated, fetchCalendarEvents]);

  return {
    events,
    refreshEvents: fetchCalendarEvents,
    isLoading,
    error,
    // Optimistic updates
    addEventOptimistic,
    updateEventOptimistic,
    removeEventOptimistic,
    confirmOptimisticUpdate,
    rollbackOptimisticUpdate,
    // New helper
    createEvent: async (eventData: Partial<CalendarEvent>) => {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (!res.ok) throw new Error('Failed to create event');
      await fetchCalendarEvents();
    },
  };
}

