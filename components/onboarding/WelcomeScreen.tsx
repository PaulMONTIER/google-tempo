'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRetroactiveAnalysis } from '@/hooks/use-retroactive-analysis';
import { Confetti } from './welcome/Confetti';
import { AnalysisLoading } from './welcome/AnalysisLoading';
import { AnalysisResults } from './welcome/AnalysisResults';
import { AnalysisEmpty } from './welcome/AnalysisEmpty';
import { AnalysisError } from './welcome/AnalysisError';

interface WelcomeScreenProps {
  onContinue?: () => void;
  onSkip?: () => void;
}

/**
 * WelcomeScreen - Écran de bienvenue post-connexion avec analyse rétroactive
 * Orchestre les différentes phases de l'analyse initiale.
 */
export function WelcomeScreen({ onContinue, onSkip }: WelcomeScreenProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  const {
    isLoading: analysisLoading,
    hasCompleted: analysisCompleted,
    phase,
    progress,
    message,
    results,
    error,
    startAnalysis,
  } = useRetroactiveAnalysis();

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current || analysisCompleted || !session?.user?.id) return;
    hasStartedRef.current = true;
    startAnalysis();
  }, [session?.user?.id, analysisCompleted, startAnalysis]);

  useEffect(() => {
    if ((analysisCompleted || phase === 'skipped') && !results && !analysisLoading && !error) {
      if (onSkip) onSkip();
      router.push('/');
    }
  }, [analysisCompleted, phase, results, analysisLoading, error, onSkip, router]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (onContinue) onContinue();
    else router.push('/onboarding');
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'toi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-notion-sidebar/95 backdrop-blur-sm">
      <Confetti active={analysisCompleted} />

      <div
        className={`
          relative z-10 max-w-lg w-full mx-6 p-8 rounded-3xl
          bg-notion-bg border border-notion-border shadow-2xl
          transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 transform translate-y-0 scale-100' : 'opacity-0 transform translate-y-8 scale-95'}
        `}
      >
        {analysisLoading && !analysisCompleted && (
          <AnalysisLoading firstName={firstName} message={message} progress={progress} phase={phase} />
        )}

        {analysisCompleted && results && (
          <AnalysisResults
            firstName={firstName}
            results={results}
            handleContinue={handleContinue}
            handleSkip={handleSkip}
            router={router}
          />
        )}

        {analysisCompleted && !results && !error && (
          <AnalysisEmpty firstName={firstName} handleContinue={handleContinue} handleSkip={handleSkip} onSkip={onSkip} />
        )}

        {error && (
          <AnalysisError firstName={firstName} error={error} handleContinue={handleContinue} handleSkip={handleSkip} onSkip={onSkip} />
        )}
      </div>
    </div>
  );
}

