'use client';

import { useRouter } from 'next/navigation';
import { Trophy, BookOpen, Dumbbell, Briefcase, Star, ArrowRight, TrendingUp } from 'lucide-react';

interface CategoryStat {
  count: number;
  points: number;
}

interface InitialSummaryProps {
  totalPoints: number;
  totalEvents: number;
  byCategory: {
    studies: CategoryStat;
    sport: CategoryStat;
    pro: CategoryStat;
    personal: CategoryStat;
    unknown: CategoryStat;
  };
  trophyLevel: {
    level: number;
    name: string;
    nextLevelPoints: number;
    progress: number;
  };
  onContinue?: () => void;
}

const categoryConfig = {
  studies: { icon: BookOpen, label: 'Études', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  sport: { icon: Dumbbell, label: 'Sport', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  pro: { icon: Briefcase, label: 'Pro', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
};

/**
 * Écran de résumé après l'analyse rétroactive
 * Affiche les points attribués par domaine
 */
export function InitialSummary({
  totalPoints,
  totalEvents,
  byCategory,
  trophyLevel,
  onContinue,
}: InitialSummaryProps) {
  const router = useRouter();

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      router.push('/');
    }
  };

  const handleViewProgression = () => {
    router.push('/progression');
  };

  // Calcule le max pour les barres de progression
  const maxPoints = Math.max(
    byCategory.studies.points,
    byCategory.sport.points,
    byCategory.pro.points,
    1
  );

  return (
    <div className="w-full max-w-lg mx-auto p-8 bg-notion-bg rounded-2xl border border-notion-border shadow-lg">
      {/* Header avec confetti emoji */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-notion-text mb-2">
          Points rétroactifs attribués !
        </h2>
        <p className="text-notion-textLight">
          On a analysé ton calendrier des 3 derniers mois
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-gradient-to-br from-notion-blue/10 to-purple-500/10 border border-notion-blue/20">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-notion-blue" />
            <span className="text-sm text-notion-textLight">Total</span>
          </div>
          <div className="text-3xl font-bold text-notion-text">{totalPoints}</div>
          <div className="text-xs text-notion-textLight">points</div>
        </div>
        <div className="p-4 rounded-xl bg-notion-sidebar border border-notion-border">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-notion-textLight">Niveau</span>
          </div>
          <div className="text-3xl font-bold text-notion-text">{trophyLevel.level}</div>
          <div className="text-xs text-notion-textLight">{trophyLevel.name}</div>
        </div>
      </div>

      {/* Détail par catégorie */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-medium text-notion-textLight uppercase tracking-wide">
          Par domaine
        </h3>

        {Object.entries(categoryConfig).map(([key, config]) => {
          const categoryKey = key as keyof typeof categoryConfig;
          const stats = byCategory[categoryKey];
          const percentage = maxPoints > 0 ? (stats.points / maxPoints) * 100 : 0;
          const Icon = config.icon;

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <span className="text-sm font-medium text-notion-text">{config.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-notion-text">{stats.points}</span>
                  <span className="text-sm text-notion-textLight ml-1">pts</span>
                  {stats.count > 0 && (
                    <span className="text-xs text-notion-textLight ml-2">
                      ({stats.count} évts)
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-notion-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${config.bgColor.replace('/10', '')}`}
                  style={{ width: `${percentage}%`, backgroundColor: config.color.replace('text-', '').includes('blue') ? '#2383e2' : config.color.replace('text-', '').includes('green') ? '#10b981' : '#8b5cf6' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Info événements */}
      <div className="p-4 rounded-xl bg-notion-sidebar border border-notion-border mb-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-notion-blue" />
          <div>
            <p className="text-sm font-medium text-notion-text">
              {totalEvents} événements analysés
            </p>
            <p className="text-xs text-notion-textLight">
              Continue comme ça pour débloquer plus de badges !
            </p>
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="space-y-3">
        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                   bg-notion-blue text-white font-semibold
                   hover:bg-notion-blue/90 transition-colors
                   shadow-lg shadow-notion-blue/25"
        >
          <span>Continuer vers Tempo</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleViewProgression}
          className="w-full px-6 py-3 rounded-xl border border-notion-border
                   text-notion-textLight hover:text-notion-text hover:bg-notion-hover
                   font-medium transition-colors"
        >
          Voir ma progression détaillée
        </button>
      </div>
    </div>
  );
}


