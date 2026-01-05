'use client';

import { useMemo } from 'react';
import { Trophy, ArrowUp, Lock } from 'lucide-react';
import {
    getArenaForXp,
    getNextArena,
    getProgressToNextArena,
    getXpToNextArena,
    Arena
} from '@/lib/gamification/arena-config';

interface ArenaDisplayProps {
    xp: number;
    showDetails?: boolean;
    compact?: boolean;
}

/**
 * Affichage de l'arène actuelle avec barre de progression
 * Style propre sans emojis
 */
export function ArenaDisplay({ xp, showDetails = true, compact = false }: ArenaDisplayProps) {
    const currentArena = useMemo(() => getArenaForXp(xp), [xp]);
    const nextArena = useMemo(() => getNextArena(currentArena), [currentArena]);
    const progress = useMemo(() => getProgressToNextArena(xp), [xp]);
    const xpToNext = useMemo(() => getXpToNextArena(xp), [xp]);

    if (compact) {
        return <CompactArenaDisplay arena={currentArena} xp={xp} />;
    }

    return (
        <div className={`
      relative overflow-hidden rounded-xl border-2 p-6
      ${currentArena.bgColor} ${currentArena.borderColor}
      transition-all duration-500
    `}>
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            {/* Contenu principal */}
            <div className="relative z-10">
                {/* Header avec icône et nom */}
                <div className="flex items-center gap-4 mb-4">
                    <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${currentArena.color}
          `}>
                        <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className={`
              text-2xl font-bold bg-gradient-to-r ${currentArena.color}
              bg-clip-text text-transparent
            `}>
                            ARÈNE {currentArena.level}
                        </h2>
                        <p className="text-xl font-semibold text-notion-text">
                            {currentArena.name.toUpperCase()}
                        </p>
                    </div>
                </div>

                {/* Barre de progression */}
                {nextArena && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-notion-textLight mb-2">
                            <span>{xp.toLocaleString()} XP</span>
                            <span>{nextArena.minXp.toLocaleString()} XP</span>
                        </div>
                        <div className="h-4 bg-notion-border rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${currentArena.color} rounded-full transition-all duration-700 ease-out`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center text-sm text-notion-textLight mt-2">
                            {progress}% vers {nextArena.name}
                        </p>
                    </div>
                )}

                {/* Niveau max atteint */}
                {!nextArena && (
                    <div className="text-center py-4">
                        <p className="text-lg font-bold text-notion-text">
                            Niveau maximum atteint
                        </p>
                        <p className="text-notion-textLight">
                            Tu es une vraie légende.
                        </p>
                    </div>
                )}

                {/* Détails supplémentaires */}
                {showDetails && nextArena && (
                    <div className="mt-4 p-3 rounded-xl bg-notion-sidebar border border-notion-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-notion-hover flex items-center justify-center">
                                <ArrowUp className="w-5 h-5 text-notion-textLight" />
                            </div>
                            <div>
                                <p className="font-medium text-notion-text">
                                    Prochaine arène : <span className="font-bold">{nextArena.name}</span>
                                </p>
                                <p className="text-sm text-notion-textLight">
                                    Plus que <span className="font-semibold text-notion-blue">{xpToNext.toLocaleString()} XP</span>
                                </p>
                            </div>
                        </div>
                        {nextArena.reward && (
                            <p className="text-xs text-notion-textLight mt-2 pl-13">
                                Récompense : {nextArena.reward}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Version compacte pour la sidebar ou les petits espaces
 */
function CompactArenaDisplay({ arena, xp }: { arena: Arena; xp: number }) {
    const progress = getProgressToNextArena(xp);

    return (
        <div className={`
      flex items-center gap-3 p-3 rounded-xl
      ${arena.bgColor} ${arena.borderColor} border
    `}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${arena.color}`}>
                <Trophy className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-notion-text truncate">
                    {arena.name}
                </p>
                <div className="h-2 bg-notion-border rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${arena.color} rounded-full`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <span className="text-xs text-notion-textLight whitespace-nowrap">
                {xp.toLocaleString()} XP
            </span>
        </div>
    );
}
