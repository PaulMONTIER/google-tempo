'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, TreeDeciduous } from '@/components/ui/icons';
import { useTreeData } from '@/hooks/use-tree-data';
import { TreeItem } from './TreeItem';
import { EmptyState } from './EmptyState';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface ArbrePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Composant principal pour afficher les arbres de préparation
 */
export function ArbrePanel({ isOpen, onClose }: ArbrePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { trees, isLoading, error, refetch } = useTreeData({ isOpen });

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, DURATIONS.animation);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity`}
        style={{
          zIndex: Z_INDEX.modalOverlay,
          transitionDuration: `${DURATIONS.animation}ms`,
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: Z_INDEX.modal }}>
        <div
          className={`w-full max-w-3xl max-h-[85vh] bg-notion-bg rounded-xl shadow-2xl pointer-events-auto transition-all duration-300 ease-out flex flex-col ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
        >
          {/* Header */}
          <div className="bg-notion-bg border-b border-notion-border px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-notion-green/15 rounded-lg flex items-center justify-center">
                <TreeDeciduous className="w-5 h-5 text-notion-green" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-notion-text">Arbres de préparation</h2>
                <p className="text-sm text-notion-textLight mt-0.5">
                  Visualisez vos parcours vers vos objectifs
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-notion-textLight" />
            </button>
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
              <div className="space-y-6">
                {trees.map((tree) => (
                  <TreeItem key={tree.id} tree={tree} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-notion-border px-6 py-4 flex-shrink-0">
            <p className="text-xs text-notion-textLight text-center">
              Les arbres sont créés automatiquement quand vous planifiez des révisions vers un objectif
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

