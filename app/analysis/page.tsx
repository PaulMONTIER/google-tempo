'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnalysisProgress, AnalysisPhase } from '@/components/onboarding/AnalysisProgress';
import { InitialSummary } from '@/components/onboarding/InitialSummary';

interface AnalysisResult {
  totalPoints: number;
  totalEvents: number;
  byCategory: {
    studies: { count: number; points: number };
    sport: { count: number; points: number };
    pro: { count: number; points: number };
    personal: { count: number; points: number };
    unknown: { count: number; points: number };
  };
  trophyLevel: {
    level: number;
    name: string;
    nextLevelPoints: number;
    progress: number;
  };
}

/**
 * Page d'analyse rétroactive du calendrier
 * Affichée après l'onboarding pour attribuer les points initiaux
 */
export default function AnalysisPage() {
  const router = useRouter();
  const { status } = useSession();
  const [phase, setPhase] = useState<AnalysisPhase>('fetching');
  const [progress, setProgress] = useState({ current: 0, total: 100 });
  const [message, setMessage] = useState('Préparation de l\'analyse...');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      startAnalysis();
    }
  }, [status, router]);

  const startAnalysis = async () => {
    try {
      // Vérifie d'abord si l'analyse a déjà été faite
      const checkResponse = await fetch('/api/analysis/retroactive');
      const checkData = await checkResponse.json();

      if (checkData.completed && checkData.results) {
        setResult(checkData.results);
        setPhase('completed');
        return;
      }

      // Simule les étapes de progression
      // Phase 1: Fetching
      setPhase('fetching');
      setMessage('Récupération de ton calendrier...');
      await simulateProgress(0, 30, 1500);

      // Phase 2: Classification
      setPhase('classifying');
      setMessage('Classification de tes événements avec l\'IA...');
      await simulateProgress(30, 70, 2500);

      // Phase 3: Calculation
      setPhase('calculating');
      setMessage('Calcul de tes points...');
      await simulateProgress(70, 90, 1000);

      // Phase 4: Saving
      setPhase('saving');
      setMessage('Sauvegarde de ta progression...');

      // Lance la vraie analyse
      const response = await fetch('/api/analysis/retroactive', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      setProgress({ current: 100, total: 100 });
      setResult(data.results);
      setPhase('completed');
      setMessage('Analyse terminée !');
    } catch (err) {
      console.error('Erreur analyse:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPhase('error');
      setMessage('Erreur lors de l\'analyse');
    }
  };

  const simulateProgress = (from: number, to: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const steps = to - from;
      const stepDuration = duration / steps;
      let current = from;

      const interval = setInterval(() => {
        current++;
        setProgress({ current, total: 100 });

        if (current >= to) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  };

  const handleContinue = () => {
    router.push('/');
  };

  const handleRetry = () => {
    setError(null);
    setPhase('fetching');
    startAnalysis();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-notion-sidebar flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-notion-blue/30 border-t-notion-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-sidebar flex items-center justify-center p-6">
      {phase === 'completed' && result ? (
        <InitialSummary
          totalPoints={result.totalPoints}
          totalEvents={result.totalEvents}
          byCategory={result.byCategory}
          trophyLevel={result.trophyLevel}
          onContinue={handleContinue}
        />
      ) : phase === 'error' ? (
        <div className="w-full max-w-md mx-auto p-6 bg-notion-bg rounded-2xl border border-notion-border shadow-lg text-center">
          <div className="text-5xl mb-4">😕</div>
          <h3 className="text-lg font-semibold text-notion-text mb-2">
            Oups, une erreur s&apos;est produite
          </h3>
          <p className="text-notion-textLight text-sm mb-6">
            {error || 'Impossible d\'analyser ton calendrier pour le moment.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2.5 bg-notion-blue text-white rounded-lg font-medium hover:bg-notion-blue/90 transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={handleContinue}
              className="w-full px-4 py-2.5 text-notion-textLight hover:text-notion-text transition-colors"
            >
              Continuer sans analyse
            </button>
          </div>
        </div>
      ) : (
        <AnalysisProgress
          phase={phase}
          current={progress.current}
          total={progress.total}
          message={message}
        />
      )}
    </div>
  );
}


