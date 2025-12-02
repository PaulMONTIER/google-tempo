'use client';

import { useSkills } from '@/hooks/use-skills';
import { SkillsRadarChart } from '@/components/progression/SkillsRadarChart';
import { SkillFamilyCard } from '@/components/progression/SkillFamilyCard';
import { useUserProgress } from '@/hooks/use-user-progress';
import { TrendingUp, Award, Target } from '@/components/icons';

export default function ProgressionPage() {
  const { skills, isLoading: skillsLoading, error: skillsError } = useSkills();
  const { progress, isLoading: progressLoading } = useUserProgress();

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-notion-text mb-2">Ma Progression</h1>
          <p className="text-notion-textLight">
            Visualisez votre progression dans toutes vos compétences
          </p>
        </div>

        {/* Stats Cards */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-notion-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-notion-textLight">Niveau</p>
                  <p className="text-2xl font-bold text-notion-text">{progress.level}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-notion-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-notion-textLight">XP Total</p>
                  <p className="text-2xl font-bold text-notion-text">{progress.xp.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-notion-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-notion-textLight">Streak</p>
                  <p className="text-2xl font-bold text-notion-text">{progress.currentStreak} jours</p>
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
                <SkillFamilyCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


