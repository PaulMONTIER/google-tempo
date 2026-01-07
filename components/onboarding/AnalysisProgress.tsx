'use client';

import { useEffect, useState } from 'react';
import { Loader2, Calendar, Brain, Calculator, CheckCircle, AlertCircle } from 'lucide-react';

export type AnalysisPhase = 'fetching' | 'classifying' | 'calculating' | 'saving' | 'completed' | 'error';

interface AnalysisProgressProps {
  phase: AnalysisPhase;
  current: number;
  total: number;
  message: string;
}

const phaseConfig: Record<AnalysisPhase, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  fetching: { icon: Calendar, color: 'text-blue-500', label: 'Récupération' },
  classifying: { icon: Brain, color: 'text-purple-500', label: 'Classification' },
  calculating: { icon: Calculator, color: 'text-orange-500', label: 'Calcul' },
  saving: { icon: Loader2, color: 'text-green-500', label: 'Sauvegarde' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Terminé' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Erreur' },
};

/**
 * Composant affichant la progression de l'analyse rétroactive
 */
export function AnalysisProgress({ phase, current, total, message }: AnalysisProgressProps) {
  const [dots, setDots] = useState('');
  const config = phaseConfig[phase];
  const Icon = config.icon;
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  // Animation des points de chargement
  useEffect(() => {
    if (phase === 'completed' || phase === 'error') return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-notion-bg rounded-2xl border border-notion-border shadow-lg">
      {/* Icône animée */}
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-2xl ${phase === 'completed' ? 'bg-green-500/10' : 'bg-notion-blue/10'} 
                        flex items-center justify-center`}>
          <Icon
            className={`w-10 h-10 ${config.color} ${phase !== 'completed' && phase !== 'error' ? 'animate-pulse' : ''}`}
          />
        </div>
      </div>

      {/* Message */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-notion-text mb-2">
          {config.label}
          {phase !== 'completed' && phase !== 'error' && <span className="text-notion-textLight">{dots}</span>}
        </h3>
        <p className="text-notion-textLight text-sm">{message}</p>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="h-2 bg-notion-hover rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out
                       ${phase === 'error' ? 'bg-red-500' : 'bg-notion-blue'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-notion-textLight">
          <span>{progress}%</span>
          {total > 0 && phase === 'classifying' && (
            <span>{current} / {total} événements</span>
          )}
        </div>
      </div>

      {/* Étapes */}
      <div className="mt-6 flex justify-between">
        {(['fetching', 'classifying', 'calculating', 'completed'] as AnalysisPhase[]).map((step, index) => {
          const stepOrder = ['fetching', 'classifying', 'calculating', 'saving', 'completed'];
          const currentOrder = stepOrder.indexOf(phase);
          const stepIndex = stepOrder.indexOf(step);
          const isActive = stepIndex <= currentOrder;
          const StepIcon = phaseConfig[step].icon;

          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                           ${isActive ? 'bg-notion-blue/20 text-notion-blue' : 'bg-notion-hover text-notion-textLight'}`}
              >
                <StepIcon className="w-4 h-4" />
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'text-notion-blue' : 'text-notion-textLight'}`}>
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


