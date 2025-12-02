import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '@/types';
import { parseTreeAnnotations } from '@/lib/trees/annotation-parser';
import { formatTreeFromAnnotations, formatTreeFromAPI, TreeGoal } from '@/lib/trees/tree-formatter';

interface UseTreeAnalysisOptions {
  isOpen: boolean;
  events: CalendarEvent[];
}

/**
 * Hook pour gérer l'analyse des arbres de préparation
 * @param options - Options de configuration (ouverture du panel, événements)
 * @returns Objet contenant les arbres détectés, état de chargement et erreurs
 */
export function useTreeAnalysis({ isOpen, events }: UseTreeAnalysisOptions) {
  const [trees, setTrees] = useState<TreeGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeEvents = useCallback(async () => {
    if (events.length === 0) {
      setTrees([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, try to find trees using annotations in descriptions
      const treeMap = parseTreeAnnotations(events);
      const annotatedTrees = formatTreeFromAnnotations(treeMap);

      if (annotatedTrees.length > 0) {
        setTrees(annotatedTrees);
      } else {
        // Fallback to AI analysis for events without annotations
        await analyzeEventsWithAI();
      }
    } catch (err: any) {
      console.error('Error analyzing trees:', err);
      setError(err.message || 'Erreur d\'analyse');
      setTrees([]);
    } finally {
      setIsLoading(false);
    }
  }, [events]);

  const analyzeEventsWithAI = async () => {
    const response = await fetch('/api/analyze-trees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'analyse');
    }

    const data = await response.json();
    const detectedTrees = formatTreeFromAPI(data, events);
    setTrees(detectedTrees);
  };

  // Analyser les événements quand le panel s'ouvre ou que les événements changent
  useEffect(() => {
    if (isOpen) {
      analyzeEvents();
    } else {
      setTrees([]);
      setError(null);
    }
  }, [isOpen, analyzeEvents]);

  return {
    trees,
    isLoading,
    error,
    refetch: analyzeEvents,
  };
}

