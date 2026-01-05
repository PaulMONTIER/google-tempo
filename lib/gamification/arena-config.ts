/**
 * Configuration du système d'arènes style Clash Royale
 * Phase 7 : Progression gamifiée non punitive
 */

export interface Arena {
    level: number;
    name: string;
    minXp: number;
    maxXp: number;      // XP max avant prochaine arène (Infinity pour la dernière)
    color: string;      // Classe Tailwind pour le dégradé
    bgColor: string;    // Couleur de fond
    borderColor: string;
    icon: string;
    reward?: string;    // Récompense débloquée
}

/**
 * Définition des 7 arènes
 */
export const ARENAS: Arena[] = [
    {
        level: 1,
        name: 'Débutant',
        minXp: 0,
        maxXp: 99,
        color: 'from-amber-700 to-amber-900',
        bgColor: 'bg-amber-900/20',
        borderColor: 'border-amber-700/50',
        icon: '🥉',
        reward: 'Bienvenue sur Tempo !',
    },
    {
        level: 2,
        name: 'Apprenti',
        minXp: 100,
        maxXp: 299,
        color: 'from-gray-400 to-gray-600',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-400/50',
        icon: '🥈',
        reward: 'Thème Argent débloqué',
    },
    {
        level: 3,
        name: 'Confirmé',
        minXp: 300,
        maxXp: 599,
        color: 'from-yellow-400 to-yellow-600',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-400/50',
        icon: '🥇',
        reward: 'Badge "Premier Pas"',
    },
    {
        level: 4,
        name: 'Expert',
        minXp: 600,
        maxXp: 999,
        color: 'from-cyan-400 to-blue-600',
        bgColor: 'bg-cyan-500/20',
        borderColor: 'border-cyan-400/50',
        icon: '💎',
        reward: 'Statistiques avancées',
    },
    {
        level: 5,
        name: 'Maître',
        minXp: 1000,
        maxXp: 1499,
        color: 'from-purple-400 to-purple-700',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-400/50',
        icon: '👑',
        reward: 'Thème Premium',
    },
    {
        level: 6,
        name: 'Champion',
        minXp: 1500,
        maxXp: 2499,
        color: 'from-red-500 to-orange-600',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        icon: '🔥',
        reward: 'Badge "Champion"',
    },
    {
        level: 7,
        name: 'Légende',
        minXp: 2500,
        maxXp: Infinity,
        color: 'from-yellow-300 via-amber-400 to-yellow-500',
        bgColor: 'bg-yellow-400/20',
        borderColor: 'border-yellow-400/50',
        icon: '⭐',
        reward: 'Badge "Légende" + Effets spéciaux',
    },
];

/**
 * Récupère l'arène correspondant à un montant d'XP
 */
export function getArenaForXp(xp: number): Arena {
    // Parcourir les arènes de la plus haute à la plus basse
    for (let i = ARENAS.length - 1; i >= 0; i--) {
        if (xp >= ARENAS[i].minXp) {
            return ARENAS[i];
        }
    }
    return ARENAS[0]; // Fallback
}

/**
 * Récupère l'arène suivante (null si déjà au max)
 */
export function getNextArena(currentArena: Arena): Arena | null {
    const nextLevel = currentArena.level + 1;
    return ARENAS.find(a => a.level === nextLevel) || null;
}

/**
 * Calcule la progression vers la prochaine arène (0-100%)
 */
export function getProgressToNextArena(xp: number): number {
    const currentArena = getArenaForXp(xp);
    const nextArena = getNextArena(currentArena);

    if (!nextArena) {
        return 100; // Arène max atteinte
    }

    const xpInCurrentArena = xp - currentArena.minXp;
    const xpNeededForNext = nextArena.minXp - currentArena.minXp;

    return Math.min(100, Math.round((xpInCurrentArena / xpNeededForNext) * 100));
}

/**
 * Calcule l'XP restant pour atteindre la prochaine arène
 */
export function getXpToNextArena(xp: number): number {
    const currentArena = getArenaForXp(xp);
    const nextArena = getNextArena(currentArena);

    if (!nextArena) {
        return 0; // Déjà au max
    }

    return nextArena.minXp - xp;
}

/**
 * Vérifie si l'utilisateur vient de monter d'arène
 */
export function hasLeveledUp(previousXp: number, newXp: number): boolean {
    const previousArena = getArenaForXp(previousXp);
    const newArena = getArenaForXp(newXp);
    return newArena.level > previousArena.level;
}

/**
 * Récupère l'arène par son niveau
 */
export function getArenaByLevel(level: number): Arena | undefined {
    return ARENAS.find(a => a.level === level);
}
