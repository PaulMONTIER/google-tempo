'use client';

import { Calendar, CheckCircle } from '@/components/icons';
import { TreeGoal } from '@/lib/trees/tree-formatter';
import { CalendarEvent } from '@/types';
import { TreeBranches } from './TreeBranches';
import { formatDateShort } from '@/lib/utils/date-formatters';
import { isPast } from '@/lib/utils/date-helpers';

interface TreeItemProps {
  tree: TreeGoal;
}

/**
 * Composant pour afficher un arbre de préparation individuel
 */
export function TreeItem({ tree }: TreeItemProps) {
  const completedBranches = tree.branches.filter(b => {
    const branchDate = new Date((b as any).start || b.startDate);
    return isPast(branchDate);
  }).length;

  return (
    <div className="border border-notion-border rounded-lg p-4">
      {/* Goal (trunk top) */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-notion-border">
        <div className="w-10 h-10 bg-notion-blue/20 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-notion-blue" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-notion-text">{tree.name}</h3>
          <p className="text-sm text-notion-textLight">{formatDateShort(tree.date)}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isPast(tree.date)
            ? 'bg-notion-green/20 text-notion-green'
            : 'bg-notion-orange/20 text-notion-orange'
        }`}>
          {isPast(tree.date) ? 'Terminé' : 'À venir'}
        </div>
      </div>

      {/* Branches */}
      <TreeBranches branches={tree.branches} />

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-notion-border">
        <p className="text-xs text-notion-textLight">
          {completedBranches} / {tree.branches.length} étapes complétées
        </p>
      </div>
    </div>
  );
}

