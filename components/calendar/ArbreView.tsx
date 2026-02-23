'use client';

import { Loader2, Network } from '@/components/ui/icons';
import { useTreeData } from '@/hooks/use-tree-data';
import { TreeItem } from '../arbre/TreeItem';
import { EmptyState } from '../arbre/EmptyState';

/**
 * Vue principale pour afficher les arbres de préparation dans le calendrier
 */
export function ArbreView() {
  const { trees, isLoading, error, refetch } = useTreeData({ isOpen: true });

  return (
    <div className="h-full w-full bg-notion-bg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-notion-green/15 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-notion-green" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-notion-text">Arbres de préparation</h2>
            <p className="text-sm text-notion-textLight mt-0.5">
              Visualisez vos parcours vers vos objectifs structurés
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-12 text-notion-textLight">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p className="text-sm">Chargement des arbres...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-notion-red">
            <p className="text-sm">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-notion-blue text-white rounded-lg text-sm hover:opacity-90"
            >
              Réessayer
            </button>
          </div>
        ) : trees.length === 0 ? (
          <EmptyState onRetry={refetch} />
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {trees.map((tree) => (
              <TreeItem key={tree.id} tree={tree} onUpdate={refetch} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 flex-shrink-0">
        <p className="text-xs text-notion-textLight text-center">
          Les arbres vous aident à décomposer un objectif majeur (comme un examen) en séances de révision ciblées.
        </p>
      </div>
    </div>
  );
}

