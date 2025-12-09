'use client';

import { CheckCircle, Calendar } from '@/components/icons';
import { BranchData } from '@/lib/services/tree-service';
import { formatDateShort } from '@/lib/utils/date-formatters';

interface TreeTimelineProps {
    branches: BranchData[];
    goalTitle: string;
    isGoalPast: boolean;
}

/**
 * Timeline horizontale pour afficher les branches d'un arbre
 */
export function TreeTimeline({ branches, goalTitle, isGoalPast }: TreeTimelineProps) {
    const allItems = [
        ...branches.map(b => ({ ...b, type: 'branch' as const })),
        { type: 'goal' as const, title: goalTitle, completed: isGoalPast },
    ];

    return (
        <div className="relative">
            {/* Container scrollable si trop d'items */}
            <div className="overflow-x-auto pb-2">
                <div className="flex items-start min-w-max">
                    {allItems.map((item, index) => {
                        const isLast = index === allItems.length - 1;
                        const isGoal = item.type === 'goal';
                        const isCompleted = isGoal ? isGoalPast : (item as BranchData).completed;

                        return (
                            <div key={index} className="flex items-start">
                                {/* Node */}
                                <div className="flex flex-col items-center" style={{ width: '100px' }}>
                                    {/* Cercle */}
                                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isGoal
                                        ? isCompleted
                                            ? 'bg-notion-green border-notion-green'
                                            : 'bg-notion-red/10 border-notion-red'
                                        : isCompleted
                                            ? 'bg-notion-green border-notion-green'
                                            : 'bg-notion-bg border-notion-border'
                                        }`}>
                                        {isGoal ? (
                                            isCompleted ? (
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            ) : (
                                                <Calendar className="w-4 h-4 text-notion-red" />
                                            )
                                        ) : isCompleted ? (
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-notion-textLight" />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="mt-3 text-center px-1">
                                        <p className={`text-xs font-medium truncate max-w-[90px] ${isGoal ? 'text-notion-text' : 'text-notion-text'
                                            }`}>
                                            {isGoal ? goalTitle : (item as BranchData).branchTitle}
                                        </p>
                                        {!isGoal && (
                                            <p className="text-[10px] text-notion-textLight mt-0.5">
                                                {formatDateShort(new Date((item as BranchData).branchDate))}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Ligne de connexion */}
                                {!isLast && (
                                    <div className="flex items-center h-8">
                                        <div className={`w-8 h-0.5 ${isCompleted ? 'bg-notion-green' : 'bg-notion-border'
                                            }`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
