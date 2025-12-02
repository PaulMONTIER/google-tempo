import { useState, useEffect, useCallback } from 'react';
import type { SkillFamilyData } from '@/lib/gamification/skill-service';

export function useSkills() {
  const [skills, setSkills] = useState<SkillFamilyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gamification/skills');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des compétences');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSkills(data.data);
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur useSkills:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFamilyDetails = useCallback(async (familyId: string) => {
    try {
      const response = await fetch(`/api/gamification/skills?familyId=${familyId}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails');
      }

      const data = await response.json();

      if (data.success && data.data) {
        return data.data as SkillFamilyData;
      } else {
        throw new Error(data.error || 'Données invalides');
      }
    } catch (err: any) {
      console.error('Erreur fetchFamilyDetails:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    isLoading,
    error,
    refetch: fetchSkills,
    fetchFamilyDetails,
  };
}


