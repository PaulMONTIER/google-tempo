'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, X, ArrowRight, Sparkles } from 'lucide-react';

interface RetroactiveBannerProps {
  totalPoints: number;
  onDismiss?: () => void;
  showViewDetails?: boolean;
}

/**
 * Bandeau affichant les points rétroactifs attribués
 * S'affiche après l'analyse du calendrier
 */
export function RetroactiveBanner({
  totalPoints,
  onDismiss,
  showViewDetails = true,
}: RetroactiveBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleViewDetails = () => {
    router.push('/progression');
  };

  return (
    <div className="bg-gradient-to-r from-notion-blue via-purple-500 to-pink-500 text-white px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Points rétroactifs attribués !</span>
              <span className="sm:hidden">Points attribués !</span>
            </p>
            <p className="text-xs text-white/80">
              <span className="font-bold text-lg">{totalPoints}</span> points de départ basés sur ton historique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showViewDetails && (
            <button
              onClick={handleViewDetails}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                       bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">Voir ma progression</span>
              <span className="sm:hidden">Voir</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

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


