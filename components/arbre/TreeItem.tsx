'use client';

import { Calendar, CheckCircle } from '@/components/icons';
import { TreeData } from '@/lib/services/tree-service';
import { TreeTimeline } from './TreeTimeline';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatDateShort } from '@/lib/utils/date-formatters';

interface TreeItemProps {
  tree: TreeData;
}

/**
 * Composant pour afficher un arbre de préparation avec timeline horizontale
 */
export function TreeItem({ tree }: TreeItemProps) {
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

        {/* Progress ring */}
        <div className="flex items-center gap-3">
          <ProgressRing
            progress={progress}
            size={44}
            strokeWidth={4}
            color={isGoalPast ? 'green' : 'blue'}
          />
        </div>
      </div>

      {/* Timeline horizontale */}
      <div className="px-5 py-6">
        <TreeTimeline
          branches={tree.branches}
          goalTitle={tree.goalTitle}
          isGoalPast={isGoalPast}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-notion-sidebar/30 border-t border-notion-border">
        <p className="text-xs text-notion-textLight">
          {completedBranches} / {tree.branches.length} étapes complétées
        </p>
      </div>
    </div>
  );
}
