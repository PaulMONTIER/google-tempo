'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface OnboardingBannerProps {
  onDismiss?: () => void;
}

/**
 * Bandeau persistant incitant à compléter l'onboarding
 * S'affiche tant que l'onboarding n'est pas terminé
 */
export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleClick = () => {
    router.push('/onboarding');
  };

  return (
    <div className="bg-gradient-to-r from-notion-blue to-blue-600 text-white px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            <span className="hidden sm:inline">
              Personnalise ton expérience Tempo ! Configure tes matières et objectifs.
            </span>
            <span className="sm:hidden">
              Configure ton profil Tempo !
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                     bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <span>Configurer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


