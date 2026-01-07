'use client';

import { useUserProgress } from '@/hooks/use-user-progress';
import { getArenaForXp, getNextArena, ARENAS, getProgressToNextArena } from '@/lib/gamification/arena-config';
import { Trophy, Gift, Lock, Check, ChevronRight } from 'lucide-react';

/**
 * Onglet Arène - Style Apple/Notion
 */
export function ArenaTab() {
    const { stats, isLoading, error } = useUserProgress();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center py-8">
                <p className="text-notion-red">{error || 'Impossible de charger les données'}</p>
            </div>
        );
    }

    const currentArena = getArenaForXp(stats.xp);
    const nextArena = getNextArena(currentArena);
    const progress = getProgressToNextArena(stats.xp);

    return (
        <div className="space-y-5">
            {/* Arène actuelle - Hero Card */}
            <div className="p-6 rounded-xl border border-notion-border bg-notion-bg">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-notion-sidebar flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-8 h-8 text-notion-textLight" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-notion-textLight uppercase tracking-wide">Rang actuel</p>
                        <p className="text-2xl font-semibold text-notion-text mt-1">{currentArena.name}</p>
                        <p className="text-sm text-notion-textLight">Niveau {currentArena.level}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-semibold text-notion-text">{stats.xp.toLocaleString()}</p>
                        <p className="text-xs text-notion-textLight">XP total</p>
                    </div>
                </div>

                {/* Progression vers arène suivante */}
                {nextArena && (
                    <div className="mt-5 pt-5 border-t border-notion-border">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-notion-textLight">Vers {nextArena.name}</span>
                            <span className="font-medium text-notion-text">{progress}%</span>
                        </div>
                        <div className="h-2 bg-notion-sidebar rounded-full overflow-hidden">
                            <div
                                className="h-full bg-notion-blue rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-notion-textLight mt-2">
                            {nextArena.minXp - stats.xp} XP restants
                        </p>
                    </div>
                )}
            </div>

            {/* Toutes les arènes */}
            <div className="p-5 rounded-xl border border-notion-border bg-notion-bg">
                <p className="text-sm font-medium text-notion-text mb-4">Toutes les arènes</p>
                <div className="space-y-2">
                    {ARENAS.map((arena) => {
                        const isUnlocked = stats.xp >= arena.minXp;
                        const isCurrent = currentArena.level === arena.level;

                        return (
                            <div
                                key={arena.level}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCurrent ? 'bg-notion-sidebar' : 'hover:bg-notion-hover'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isUnlocked ? 'bg-notion-sidebar' : 'bg-notion-hover'
                                    }`}>
                                    {isUnlocked ? (
                                        <Trophy className="w-4 h-4 text-notion-textLight" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-notion-textLight opacity-50" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${isUnlocked ? 'text-notion-text' : 'text-notion-textLight'}`}>
                                        {arena.name}
                                    </p>
                                    <p className="text-xs text-notion-textLight">{arena.minXp.toLocaleString()} XP</p>
                                </div>
                                {isCurrent && (
                                    <span className="text-xs font-medium text-notion-blue">Actuelle</span>
                                )}
                                {isUnlocked && !isCurrent && (
                                    <Check className="w-4 h-4 text-green-500" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Récompenses */}
            <div className="p-5 rounded-xl border border-notion-border bg-notion-bg">
                <p className="text-sm font-medium text-notion-text mb-4">Récompenses</p>
                <div className="space-y-2">
                    {ARENAS.filter(a => a.reward).map((arena) => {
                        const isUnlocked = stats.xp >= arena.minXp;

                        return (
                            <div
                                key={arena.level}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-notion-hover transition-colors"
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isUnlocked ? 'bg-notion-sidebar' : 'bg-notion-hover'
                                    }`}>
                                    {isUnlocked ? (
                                        <Gift className="w-4 h-4 text-notion-textLight" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-notion-textLight opacity-50" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${isUnlocked ? 'text-notion-text' : 'text-notion-textLight'}`}>
                                        {arena.reward}
                                    </p>
                                    <p className="text-xs text-notion-textLight">{arena.name}</p>
                                </div>
                                {isUnlocked ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <span className="text-xs text-notion-textLight">{arena.minXp} XP</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
