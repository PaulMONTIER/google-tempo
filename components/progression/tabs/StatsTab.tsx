'use client';

import { useUserProgress } from '@/hooks/use-user-progress';
import { Award, Flame, Target, CheckCircle, TrendingUp, Zap } from 'lucide-react';

/**
 * Onglet Statistiques - Style Apple/Notion
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

    const completionRate = stats.totalTasksCreated > 0
        ? Math.round((stats.totalTasksCompleted / stats.totalTasksCreated) * 100)
        : 0;

    return (
        <div className="space-y-5">
            {/* Grandes métriques en haut */}
            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    icon={Award}
                    value={stats.xp.toLocaleString()}
                    label="XP Total"
                />
                <MetricCard
                    icon={TrendingUp}
                    value={stats.level.toString()}
                    label="Niveau"
                />
                <MetricCard
                    icon={Flame}
                    value={stats.currentStreak.toString()}
                    label="Jours de streak"
                />
            </div>

            {/* Progression vers niveau suivant */}
            <div className="p-5 rounded-xl border border-notion-border bg-notion-bg">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-notion-text">Progression niveau {stats.level}</span>
                    <span className="text-sm text-notion-textLight">{stats.xpToNextLevel} XP restants</span>
                </div>
                <div className="h-2 bg-notion-sidebar rounded-full overflow-hidden">
                    <div
                        className="h-full bg-notion-blue rounded-full transition-all duration-500"
                        style={{ width: `${stats.progressToNextLevel}%` }}
                    />
                </div>
            </div>

            {/* Stats détaillées en grille */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    icon={Zap}
                    title="Meilleur streak"
                    value={`${stats.longestStreak} jours`}
                />
                <StatCard
                    icon={CheckCircle}
                    title="Quiz complétés"
                    value={stats.totalQuizzesCompleted.toString()}
                />
                <StatCard
                    icon={Target}
                    title="Tâches créées"
                    value={stats.totalTasksCreated.toString()}
                />
                <StatCard
                    icon={CheckCircle}
                    title="Tâches complétées"
                    value={`${stats.totalTasksCompleted} (${completionRate}%)`}
                />
            </div>
        </div>
    );
}

/**
 * Grande carte métrique - style Apple
 */
function MetricCard({
    icon: Icon,
    value,
    label
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
}) {
    return (
        <div className="p-5 rounded-xl border border-notion-border bg-notion-bg text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-notion-sidebar flex items-center justify-center">
                <Icon className="w-5 h-5 text-notion-textLight" />
            </div>
            <p className="text-2xl font-semibold text-notion-text tracking-tight">{value}</p>
            <p className="text-xs text-notion-textLight mt-1">{label}</p>
        </div>
    );
}

/**
 * Carte stat secondaire - style Notion
 */
function StatCard({
    icon: Icon,
    title,
    value
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
}) {
    return (
        <div className="p-4 rounded-xl border border-notion-border bg-notion-bg">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-notion-sidebar flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-notion-textLight" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-notion-textLight">{title}</p>
                    <p className="text-base font-medium text-notion-text truncate">{value}</p>
                </div>
            </div>
        </div>
    );
}
