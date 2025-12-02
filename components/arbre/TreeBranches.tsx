'use client';

import { CheckCircle } from '@/components/icons';
import { CalendarEvent } from '@/types';
import { formatDateShort } from '@/lib/utils/date-formatters';
import { isPast } from '@/lib/utils/date-helpers';

interface TreeBranchesProps {
  branches: CalendarEvent[];
}

/**
 * Récupère la date d'un événement
 */
function getEventDate(event: CalendarEvent): Date {
  return new Date((event as any).start || event.startDate);
}

/**
 * Composant pour afficher les branches d'un arbre de préparation
 */
export function TreeBranches({ branches }: TreeBranchesProps) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-notion-border" />

      <div className="space-y-3">
        {branches.map((branch) => {
          const branchDate = getEventDate(branch);
          const branchIsPast = isPast(branchDate);

          return (
            <div key={branch.id} className="relative flex items-center gap-3">
              {/* Branch connector */}
              <div className="absolute -left-3 w-3 h-0.5 bg-notion-border" />

              {/* Branch node */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                branchIsPast
                  ? 'bg-notion-green/20'
                  : 'bg-notion-sidebar'
              }`}>
                {branchIsPast ? (
                  <CheckCircle className="w-4 h-4 text-notion-green" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-notion-textLight" />
                )}
              </div>

              {/* Branch content */}
              <div className="flex-1 py-2 px-3 bg-notion-sidebar/50 rounded-lg">
                <p className="text-sm font-medium text-notion-text">{branch.title}</p>
                <p className="text-xs text-notion-textLight">{formatDateShort(branchDate)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

