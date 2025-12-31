'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export interface AnalysisResult {
  success: boolean;
  totalEvents: number;
  totalPoints: number;
  byCategory: Record<string, { count: number; points: number }>;
  trophyLevel: {
    level: number;
    name: string;
    nextLevelPoints: number;
    progress: number;
  };
  analyzedPeriod: {
    start: Date;
    end: Date;
  };
}

type AnalysisPhase = 'idle' | 'checking' | 'fetching' | 'classifying' | 'calculating' | 'saving' | 'completed' | 'error' | 'skipped';

interface UseRetroactiveAnalysisReturn {
  // État
  isLoading: boolean;
  hasCompleted: boolean;
  phase: AnalysisPhase;
  progress: number;
  message: string;
  results: AnalysisResult | null;
  error: string | null;
  
  // Actions
  startAnalysis: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

/**
 * Hook pour gérer l'analyse rétroactive du calendrier
 * Lancée automatiquement à la première connexion UNIQUEMENT
 */
export function useRetroactiveAnalysis(): UseRetroactiveAnalysisReturn {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs pour éviter les doubles appels et les boucles infinies
  const isAnalyzingRef = useRef(false);
  const hasCheckedRef = useRef(false);
  const hasTriedRef = useRef(false); // Empêche les retries après erreur

  // Vérifie si l'analyse a déjà été faite
  const checkStatus = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    // Éviter les doubles vérifications
    if (hasCheckedRef.current) {
      return;
    }
    hasCheckedRef.current = true;

    try {
      setPhase('checking');
      const response = await fetch('/api/analysis/retroactive');
      
      // 🛡️ Gérer les erreurs sans crash
      if (!response.ok) {
        console.warn('[RetroactiveAnalysis] Check status failed:', response.status);
        setPhase('idle');
        return;
      }
      
      const data = await response.json();
      if (data.completed) {
        setHasCompleted(true);
        setResults(data.results || null);
        setPhase('completed');
        setProgress(100);
        hasTriedRef.current = true; // Marquer comme traité
      }
    } catch (err) {
      console.warn('[RetroactiveAnalysis] Erreur check status (non-bloquante):', err);
      setPhase('idle');
    }
  }, [session?.user?.id, status]);

  // Vérifie le statut au chargement (UNE SEULE FOIS)
  useEffect(() => {
    if (status === 'authenticated' && !hasCheckedRef.current) {
      checkStatus();
    }
  }, [status, checkStatus]);

  // Lance l'analyse
  const startAnalysis = useCallback(async () => {
    // Vérifications de base
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('[RetroactiveAnalysis] Skip - not authenticated');
      return;
    }

    // 🛡️ Protection contre les boucles infinies
    if (isAnalyzingRef.current || hasCompleted || isLoading || hasTriedRef.current) {
      console.log('[RetroactiveAnalysis] Skip - already completed, loading, or tried');
      return;
    }
    
    // Marquer comme essayé AVANT de lancer
    hasTriedRef.current = true;
    isAnalyzingRef.current = true;
    setIsLoading(true);
    setError(null);
    setPhase('fetching');
    setProgress(0);
    setMessage('Récupération de ton calendrier...');

    // Progression simulée
    const progressSteps = [
      { phase: 'fetching' as const, progress: 20, message: 'Récupération de ton calendrier...' },
      { phase: 'classifying' as const, progress: 50, message: 'Analyse de tes événements...' },
      { phase: 'calculating' as const, progress: 80, message: 'Calcul de tes points...' },
      { phase: 'saving' as const, progress: 95, message: 'Enregistrement...' },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        const step = progressSteps[stepIndex];
        setPhase(step.phase);
        setProgress(step.progress);
        setMessage(step.message);
        stepIndex++;
      }
    }, 1500);

    try {
      const response = await fetch('/api/analysis/retroactive', {
        method: 'POST',
      });

      clearInterval(progressInterval);

      // 🛡️ Gérer les erreurs HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[RetroactiveAnalysis] API Error:', response.status, errorData);
        
        // Si déjà complété côté serveur, considérer comme OK
        if (errorData.alreadyCompleted) {
          setHasCompleted(true);
          setResults(null);
          setPhase('skipped');
          setProgress(100);
          return;
        }
        
        throw new Error(errorData.details || errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();

      // Si l'analyse a DÉJÀ été faite
      if (data.alreadyCompleted) {
        console.log('[RetroactiveAnalysis] ⚠️ Analyse déjà faite - skip');
        setHasCompleted(true);
        setResults(null);
        setPhase('skipped');
        setProgress(100);
        return;
      }
      
      // ✅ Première analyse réussie
      if (data.success) {
        setHasCompleted(true);
        setResults(data.results);
        setPhase('completed');
        setProgress(100);
        setMessage('Analyse terminée !');
      }
    } catch (err) {
      console.error('[RetroactiveAnalysis] Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setPhase('error');
      // 🛡️ Ne PAS remettre hasTriedRef à false - évite les boucles infinies
    } finally {
      setIsLoading(false);
      isAnalyzingRef.current = false;
    }
  }, [session?.user?.id, status, hasCompleted, isLoading]);

  return {
    isLoading,
    hasCompleted,
    phase,
    progress,
    message,
    results,
    error,
    startAnalysis,
    checkStatus,
  };
}
