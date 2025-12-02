import { useState, useEffect, useCallback } from 'react';
import type { TaskValidationData } from '@/lib/gamification/task-validation-service';

export function useTaskValidations() {
  const [tasks, setTasks] = useState<TaskValidationData[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gamification/task-validations');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tâches');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Convertir les dates string en Date objects
        const tasksWithDates = data.data.map((t: any) => ({
          ...t,
          eventDate: new Date(t.eventDate),
          validatedAt: t.validatedAt ? new Date(t.validatedAt) : null,
        }));
        setTasks(tasksWithDates);
        setPendingCount(tasksWithDates.length);
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur useTaskValidations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/task-validations?count=true');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du nombre');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setPendingCount(data.data.count);
      }
    } catch (err: any) {
      console.error('Erreur fetchCount:', err);
    }
  }, []);

  const validateTask = useCallback(
    async (validationId: string, completed: boolean, notes?: string) => {
      try {
        const response = await fetch('/api/gamification/task-validations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            validationId,
            completed,
            notes,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la validation');
        }

        // Retirer la tâche de la liste si validée
        if (completed) {
          setTasks((prev) => prev.filter((t) => t.id !== validationId));
          setPendingCount((prev) => Math.max(0, prev - 1));
        } else {
          // Recharger les tâches
          await fetchTasks();
        }
      } catch (err: any) {
        console.error('Erreur validateTask:', err);
        throw err;
      }
    },
    [fetchTasks]
  );

  const dismissTask = useCallback(
    async (validationId: string) => {
      try {
        const response = await fetch(
          `/api/gamification/task-validations?validationId=${validationId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Erreur lors de l\'ignorance de la tâche');
        }

        // Retirer la tâche de la liste
        setTasks((prev) => prev.filter((t) => t.id !== validationId));
        setPendingCount((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        console.error('Erreur dismissTask:', err);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    fetchTasks();
    fetchCount();

    // Refresh automatique toutes les 30 minutes
    const interval = setInterval(() => {
      fetchTasks();
      fetchCount();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchTasks, fetchCount]);

  return {
    tasks,
    pendingCount,
    isLoading,
    error,
    refetch: fetchTasks,
    validateTask,
    dismissTask,
  };
}


