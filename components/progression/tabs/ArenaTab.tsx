'use client';

import { useUserProgress } from '@/hooks/use-user-progress';
import { ArenaDisplay } from '@/components/progression/ArenaDisplay';
import { Section } from '@/components/progression/components';
import { getArenaForXp, getNextArena, ARENAS } from '@/lib/gamification/arena-config';
import { Trophy, Gift, Award, Lock, Check } from 'lucide-react';

/**
 * Onglet Arène - Style cohérent avec les Settings, sans emojis
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

    return (
        <div className="space-y-6">
            {/* Arène actuelle */}
            <Section title="Ton arène actuelle" icon={Trophy}>
                <ArenaDisplay xp={stats.xp} showDetails={true} />
            </Section>

            {/* Récompenses débloquées */}
            <Section title="Récompenses débloquées" icon={Gift}>
                <div className="p-4 bg-notion-sidebar rounded-xl border border-notion-border">
                    <div className="space-y-2">
                        {ARENAS.filter(a => stats.xp >= a.minXp && a.reward).map((arena) => (
                            <div key={arena.level} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-notion-hover transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${arena.bgColor}`}>
                                    <Trophy className="w-4 h-4 text-notion-textLight" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-notion-text">{arena.name}</p>
                                    <p className="text-xs text-notion-textLight">{arena.reward}</p>
                                </div>
                                <Check className="w-4 h-4 text-green-500" />
                            </div>
                        ))}
                        {!ARENAS.some(a => stats.xp >= a.minXp && a.reward) && (
                            <p className="text-sm text-notion-textLight">
                                Aucune récompense encore débloquée
                            </p>
                        )}
                    </div>
                </div>
            </Section>

            {/* Prochaine récompense */}
            {nextArena && nextArena.reward && (
                <Section title="Prochaine récompense" icon={Lock}>
                    <div className="p-4 bg-notion-sidebar rounded-xl border border-notion-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-notion-hover flex items-center justify-center">
                                <Lock className="w-5 h-5 text-notion-textLight" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-notion-text">Arène {nextArena.name}</p>
                                <p className="text-xs text-notion-textLight mt-1">{nextArena.reward}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-notion-blue">{nextArena.minXp - stats.xp} XP</p>
                                <p className="text-xs text-notion-textLight">restants</p>
                            </div>
                        </div>
                    </div>
                </Section>
            )}

            {/* Toutes les arènes */}
            <Section title="Progression des arènes" icon={Award}>
                <div className="grid grid-cols-7 gap-2">
                    {ARENAS.map((arena) => {
                        const isUnlocked = stats.xp >= arena.minXp;
                        const isCurrent = currentArena.level === arena.level;

                        return (
                            <div
                                key={arena.level}
                                className={`
                  flex flex-col items-center p-3 rounded-lg border transition-all
                  ${isCurrent
                                        ? `${arena.bgColor} ${arena.borderColor} border-2 shadow-md`
                                        : isUnlocked
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                            : 'bg-notion-sidebar border-notion-border opacity-50'
                                    }
                `}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUnlocked ? arena.bgColor : 'bg-notion-hover'}`}>
                                    {isUnlocked ? (
                                        <Trophy className="w-4 h-4 text-notion-text" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-notion-textLight" />
                                    )}
                                </div>
                                <span className="text-xs text-notion-textLight mt-1 text-center">{arena.name}</span>
                                <span className="text-[10px] text-notion-textLight">{arena.minXp} XP</span>
                            </div>
                        );
                    })}
                </div>
            </Section>
        </div>
    );
}
