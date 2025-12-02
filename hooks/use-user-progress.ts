import { useState, useEffect, useCallback } from 'react';

export interface ProgressStats {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalActions: number;
  totalTasksCreated: number;
  totalTasksCompleted: number;
  totalQuizzesCompleted: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
}

export function useUserProgress() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gamification/progress');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la progression');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur useUserProgress:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchProgress,
  };
}


