'use client';

import { useSkills } from '@/hooks/use-skills';
import { SkillsRadarChart } from '@/components/progression/SkillsRadarChart';
import { SkillFamilyCard } from '@/components/progression/SkillFamilyCard';
import { Section } from '@/components/progression/components';
import { TrendingUp, BookOpen } from 'lucide-react';

/**
 * Onglet Compétences - Style cohérent avec les Settings
 */
export function SkillsTab() {
    const { skills, isLoading, error } = useSkills();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-notion-red">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Radar Chart */}
            <Section title="Radar des compétences" icon={TrendingUp}>
                <div className="p-4 bg-notion-sidebar rounded-xl border border-notion-border">
                    <SkillsRadarChart skills={skills} />
                </div>
            </Section>

            {/* Skills Grid */}
            <Section title="Familles de compétences" icon={BookOpen}>
                {skills.length === 0 ? (
                    <div className="p-6 bg-notion-sidebar rounded-xl border border-notion-border text-center">
                        <p className="text-sm text-notion-textLight">
                            Aucune compétence enregistrée. Créez des événements pour développer vos compétences !
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {skills.map((skill) => (
                            <SkillFamilyCard key={skill.id} skill={skill} />
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
}
