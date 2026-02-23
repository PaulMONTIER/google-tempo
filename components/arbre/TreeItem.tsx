'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, CheckCircle, MoreHorizontal, Trash, Edit3, Loader2 } from '@/components/ui/icons';
import { TreeData } from '@/lib/services/tree-service';
import { TreeTimeline } from './TreeTimeline';
import { TreeEditModal } from './TreeEditModal';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatDateShort } from '@/lib/utils/date-formatters';
import { useNotifications } from '@/components/notifications/NotificationSystem';

interface TreeItemProps {
  tree: TreeData;
  onUpdate?: () => void;
}

/**
 * Composant pour afficher un arbre de préparation avec timeline horizontale
 */
export function TreeItem({ tree, onUpdate }: TreeItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();



  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Handle tree deletion
  const handleDeleteTree = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet arbre et toutes ses séances de révision associées ?')) {
      return;
    }

    setIsDeleting(true);
    setIsMenuOpen(false);

    try {
      // Pour l'instant on appelle l'API pour supprimer la DB
      // L'API devrait aussi supprimer les événements Calendar
      const res = await fetch(`/api/trees/${tree.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');

      addNotification({
        title: 'Arbre supprimé',
        message: 'L\'arbre de préparation a été supprimé avec succès.',
        type: 'success',
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      addNotification({
        title: 'Erreur',
        message: 'Impossible de supprimer l\'arbre.',
        type: 'error',
      });
      setIsDeleting(false);
    }
  };


  const completedBranches = tree.branches.filter(b => b.completed).length;
  const totalSteps = tree.branches.length + 1; // +1 pour l'objectif
  const progress = totalSteps > 1
    ? Math.round((completedBranches / (totalSteps - 1)) * 100)
    : 0;

  const goalDate = new Date(tree.goalDate);
  const isGoalPast = goalDate < new Date();

  return (
    <div className="bg-notion-bg border border-notion-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-notion-border">
        <div className="flex items-center gap-4">
          {/* Icon objectif */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isGoalPast
            ? 'bg-notion-green/15'
            : 'bg-notion-red/15'
            }`}>
            {isGoalPast ? (
              <CheckCircle className="w-5 h-5 text-notion-green" />
            ) : (
              <Calendar className="w-5 h-5 text-notion-red" />
            )}
          </div>

          {/* Title & date */}
          <div>
            <h3 className="font-semibold text-notion-text">{tree.goalTitle}</h3>
            <p className="text-sm text-notion-textLight">{formatDateShort(goalDate)}</p>
          </div>
        </div>

        {/* Progress ring & Options */}
        <div className="flex items-center gap-4">
          <ProgressRing
            progress={progress}
            size={44}
            strokeWidth={4}
            color={isGoalPast ? 'green' : 'blue'}
          />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-notion-textLight hover:bg-notion-hover rounded-md transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreHorizontal className="w-5 h-5" />}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-notion-bg border border-notion-border rounded-md shadow-lg overflow-hidden z-20 py-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2"
                  onClick={() => {
                    setIsEditModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <Edit3 className="w-4 h-4 text-notion-textLight" />
                  Modifier l'arbre complet
                </button>
                <div className="h-px bg-notion-border my-1" />
                <button
                  onClick={handleDeleteTree}
                  className="w-full text-left px-3 py-2 text-sm text-notion-red hover:bg-notion-red/10 flex items-center gap-2"
                >
                  <Trash className="w-4 h-4" />
                  Supprimer l'arbre
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline horizontale */}
      <div className="px-5 py-6 overflow-visible">
        <TreeTimeline
          treeId={tree.id}
          branches={tree.branches}
          goalTitle={tree.goalTitle}
          isGoalPast={isGoalPast}
          onUpdate={onUpdate}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-notion-sidebar/30 border-t border-notion-border">
        <p className="text-xs text-notion-textLight">
          {completedBranches} / {tree.branches.length} étapes complétées
        </p>
      </div>

      <TreeEditModal
        tree={tree}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={() => onUpdate && onUpdate()}
      />
    </div>
  );
}
