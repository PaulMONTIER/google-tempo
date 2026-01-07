'use client';

import { GitBranch } from '@/components/ui/icons';

interface EmptyStateProps {
  onRetry?: () => void;
}

/**
 * Composant pour afficher l'état vide (aucun arbre détecté)
 */
export function EmptyState({ onRetry }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-notion-textLight">
      <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg mb-2">Aucun arbre détecté</p>
      <p className="text-sm max-w-md mx-auto">
        Créez des événements de révision liés à un contrôle ou examen pour voir apparaître un arbre de préparation.
      </p>
      <p className="text-xs mt-4 text-notion-textLight/70">
        Exemple : "Place des révisions pour mon contrôle de math du 25"
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 px-4 py-2 bg-notion-blue text-white rounded-lg text-sm hover:opacity-90"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

