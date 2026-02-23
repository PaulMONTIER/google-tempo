'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSkills } from '@/hooks/use-skills';
import { SkillsRadarChart } from '@/components/progression/SkillsRadarChart';
import { SkillFamilyCard } from '@/components/progression/SkillFamilyCard';
import { ArenaDisplay } from '@/components/progression/ArenaDisplay';
import { ArenaUpgradeModal } from '@/components/progression/ArenaUpgradeModal';
import { useUserProgress } from '@/hooks/use-user-progress';
import { getArenaForXp, hasLeveledUp, Arena } from '@/lib/gamification/arena-config';
import { TrendingUp, Award, Target, Flame } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

export default function ProgressionPage() {
  const router = useRouter();
  const { skills, isLoading: skillsLoading, error: skillsError } = useSkills();
  const { stats: progress, isLoading: progressLoading } = useUserProgress();

  // État pour le modal d'upgrade d'arène
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newArena, setNewArena] = useState<Arena | null>(null);
  const [previousXp, setPreviousXp] = useState<number | null>(null);

  // Détecter une montée d'arène
  useEffect(() => {
    if (progress && previousXp !== null) {
      if (hasLeveledUp(previousXp, progress.xp)) {
        const arena = getArenaForXp(progress.xp);
        setNewArena(arena);
        setShowUpgradeModal(true);
      }
    }
    if (progress) {
      setPreviousXp(progress.xp);
    }
  }, [progress?.xp, previousXp]);

  if (skillsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-notion-blue mx-auto mb-4"></div>
          <p className="text-notion-textLight">Chargement de votre progression...</p>
        </div>
      </div>
    );
  }

  if (skillsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-notion-red mb-4">Erreur lors du chargement des compétences</p>
          <p className="text-notion-textLight text-sm">{skillsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec bouton retour */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-notion-textLight hover:text-notion-text 
                     transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Retour à Tempo</span>
          </button>
          <h1 className="text-3xl font-bold text-notion-text mb-2">Ma Progression</h1>
          <p className="text-notion-textLight">
            Visualisez votre progression dans toutes vos compétences
          </p>
        </div>

        {/* Arène Display - Section principale */}
        {progress && (
          <div className="mb-8">
            <ArenaDisplay xp={progress.xp} showDetails={true} />
          </div>
        )}

        {/* Stats Cards */}
        {progress && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-notion-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-notion-textLight">Niveau</p>
                  <p className="text-xl font-bold text-notion-text">{progress.level}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-notion-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-notion-textLight">XP Total</p>
                  <p className="text-xl font-bold text-notion-text">{progress.xp.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-notion-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-notion-textLight">Streak</p>
                  <p className="text-xl font-bold text-notion-text">{progress.currentStreak} jours</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-notion-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-notion-textLight">Quiz complétés</p>
                  <p className="text-xl font-bold text-notion-text">{progress.totalQuizzesCompleted}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Radar Chart */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-notion-text mb-4">Radar des Compétences</h2>
          <SkillsRadarChart skills={skills} />
        </div>

        {/* Skills Grid */}
        <div>
          <h2 className="text-xl font-semibold text-notion-text mb-4">Familles de Compétences</h2>
          {skills.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-notion-border">
              <p className="text-notion-textLight">
                Aucune compétence enregistrée. Commencez à créer des événements pour développer vos compétences !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill) => (
                <SkillFamilyCard key={skill.id} skill={skill as any} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'upgrade d'arène */}
      {newArena && (
        <ArenaUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          newArena={newArena}
        />
      )}
    </div>
  );
}
