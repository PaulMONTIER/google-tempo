'use client';

import { useState } from 'react';
import { Loader2, Network, Filter } from '@/components/ui/icons';
import { useTreeData } from '@/hooks/use-tree-data';
import { TreeItem } from '../arbre/TreeItem';
import { EmptyState } from '../arbre/EmptyState';

type TypeFilter = 'Tout' | 'Cours' | 'Connecteur';
type StatusFilter = 'En cours & À venir' | 'Tous';

/**
 * Vue principale pour afficher les arbres de préparation dans le calendrier
 */
export function ArbreView() {
  const { trees, isLoading, error, refetch } = useTreeData({ isOpen: true });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Tout');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('En cours & À venir');

  const filteredTrees = trees.filter(tree => {
    // 1. Filtrer par type
    const isConnecteur = tree.goalTitle.includes('(Strava MOCK)');
    if (typeFilter === 'Connecteur' && !isConnecteur) return false;
    if (typeFilter === 'Cours' && isConnecteur) return false;

    // 2. Filtrer par statut
    if (statusFilter === 'En cours & À venir') {
      const isPast = new Date(tree.goalDate) < new Date(new Date().setHours(0, 0, 0, 0));
      if (isPast) return false;
    }

    return true;
  });

  return (
    <div className="h-full w-full bg-notion-bg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-notion-border/50">
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

        {/* Filtres à droite */}
        <div className="flex flex-col items-end gap-2">

          {/* Statut Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-notion-textLight uppercase tracking-wider">Statut</span>
            <div className="flex bg-notion-sidebar/50 p-1 rounded-lg border border-notion-border">
              {(['Tous', 'En cours & À venir'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${statusFilter === f
                      ? 'bg-notion-bg text-notion-text shadow-sm border border-notion-border/50'
                      : 'text-notion-textLight hover:text-notion-text hover:bg-notion-hover/50'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-notion-textLight uppercase tracking-wider"><Filter className="w-3 h-3 inline mr-1" />Type</span>
            <div className="flex bg-notion-sidebar/50 p-1 rounded-lg border border-notion-border">
              {(['Tout', 'Cours', 'Connecteur'] as TypeFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${typeFilter === f
                      ? 'bg-notion-bg text-notion-text shadow-sm border border-notion-border/50'
                      : 'text-notion-textLight hover:text-notion-text hover:bg-notion-hover/50'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
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
        ) : filteredTrees.length === 0 ? (
          <EmptyState onRetry={refetch} />
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {filteredTrees.map((tree) => (
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

