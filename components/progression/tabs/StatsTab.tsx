'use client';

import { useUserProgress } from '@/hooks/use-user-progress';
import { Section } from '@/components/progression/components';
import { Award, Flame, Target, CheckCircle, Zap, BarChart3 } from 'lucide-react';

/**
 * Onglet Statistiques - Style cohérent avec les Settings
 */
export function StatsTab() {
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

    return (
        <div className="space-y-6">
            {/* XP & Niveau */}
            <Section title="Expérience" icon={Award}>
                <div className="space-y-3">
                    <StatRow label="XP Total" value={stats.xp.toLocaleString()} icon={Award} />
                    <StatRow label="Niveau" value={stats.level.toString()} icon={BarChart3} />
                </div>

                {/* Barre de progression vers prochain niveau */}
                <div className="mt-4 p-4 bg-notion-sidebar rounded-lg border border-notion-border">
                    <div className="flex justify-between text-sm text-notion-textLight mb-2">
                        <span>Niveau {stats.level}</span>
                        <span>Niveau {stats.level + 1}</span>
                    </div>
                    <div className="h-2 bg-notion-border rounded-full overflow-hidden">
                        <div
                            className="h-full bg-notion-blue rounded-full transition-all"
                            style={{ width: `${stats.progressToNextLevel}%` }}
                        />
                    </div>
                    <p className="text-center text-xs text-notion-textLight mt-2">
                        {stats.xpToNextLevel} XP pour le prochain niveau
                    </p>
                </div>
            </Section>

            {/* Streaks */}
            <Section title="Régularité" icon={Flame}>
                <div className="space-y-3">
                    <StatRow label="Streak actuel" value={`${stats.currentStreak} jours`} icon={Flame} />
                    <StatRow label="Meilleur streak" value={`${stats.longestStreak} jours`} icon={Zap} />
                </div>
            </Section>

            {/* Activité */}
            <Section title="Activité" icon={Target}>
                <div className="space-y-3">
                    <StatRow label="Tâches créées" value={stats.totalTasksCreated.toString()} icon={Target} />
                    <StatRow label="Tâches complétées" value={stats.totalTasksCompleted.toString()} icon={CheckCircle} />
                </div>
            </Section>

            {/* Quiz */}
            <Section title="Quiz" icon={CheckCircle}>
                <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-notion-hover transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-notion-sidebar rounded-lg border border-notion-border">
                            <CheckCircle className="w-4 h-4 text-notion-textLight" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-notion-text">Quiz complétés</p>
                            <p className="text-xs text-notion-textLight">Validez vos événements pour gagner de l&apos;XP</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-notion-text">{stats.totalQuizzesCompleted}</span>
                </div>
            </Section>
        </div>
    );
}

/**
 * Ligne de statistique - Style identique aux Settings
 */
function StatRow({
    label,
    value,
    icon: Icon
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-notion-hover transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-notion-sidebar rounded-lg border border-notion-border">
                    <Icon className="w-4 h-4 text-notion-textLight" />
                </div>
                <span className="text-sm font-medium text-notion-text">{label}</span>
            </div>
            <span className="text-lg font-semibold text-notion-text">{value}</span>
        </div>
    );
}
