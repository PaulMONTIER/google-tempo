import { useState, useEffect, useCallback } from 'react';
import type { Reminder } from '@/components/notifications/ReminderCard';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/reminders');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des rappels');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Convertir les dates string en Date objects
        const remindersWithDates = data.data.map((r: any) => ({
          ...r,
          goalDate: new Date(r.goalDate),
        }));
        setReminders(remindersWithDates);
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur useReminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissReminder = useCallback(async (reminderId: string) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) return;

    try {
      const response = await fetch('/api/notifications/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: reminder.eventId,
          reminderDay: reminder.daysBefore,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la fermeture du rappel');
      }

      // Retirer le rappel de la liste locale
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err: any) {
      console.error('Erreur dismissReminder:', err);
      // Ne pas afficher d'erreur à l'utilisateur, juste logger
    }
  }, [reminders]);

  useEffect(() => {
    fetchReminders();

    // Refresh automatique toutes les heures
    const interval = setInterval(() => {
      fetchReminders();
    }, 60 * 60 * 1000); // 1 heure

    return () => clearInterval(interval);
  }, [fetchReminders]);

  return {
    reminders,
    isLoading,
    error,
    refetch: fetchReminders,
    dismissReminder,
  };
}


