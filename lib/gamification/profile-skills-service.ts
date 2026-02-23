import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export interface UserSkillData {
    id: string;
    name: string;
    level: number; // 0-100
    xp: number;
    color: string;
}

// Couleurs pour les matières (palette harmonieuse)
const SUBJECT_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#14b8a6', // Teal
];

function getColorForIndex(index: number): string {
    return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

/**
 * Récupère les compétences de l'utilisateur BASÉES SUR SES MATIÈRES du profil
 * Plus de hardcoding - tout vient du profil utilisateur
 */
export async function getUserSkillsFromProfile(userId: string): Promise<UserSkillData[]> {
    try {
        // 1. Récupérer TOUTE la progression de l'utilisateur
        const progressList = await prisma.userSkillProgress.findMany({
            where: { userId },
            include: {
                skillFamily: true,
                skillDetail: true
            }
        });

        if (progressList.length === 0) {
            // S'il n'y a rien, on fallback sur les préférences comme avant
            const preferences = await prisma.userPreferences.findUnique({
                where: { userId },
            });

            if (!preferences || !preferences.studySubjects || preferences.studySubjects.length === 0) {
                logger.debug(`[skill-service] Aucune matière ou progression pour userId: ${userId}`);
                return [];
            }

            const subjects = preferences.studySubjects;
            const skillsData: UserSkillData[] = [];

            // Créer les familles pour les matières
            for (let i = 0; i < subjects.length; i++) {
                const subjectName = subjects[i];
                let skillFamily = await prisma.skillFamily.findFirst({
                    where: { name: subjectName },
                });

                if (!skillFamily) {
                    skillFamily = await prisma.skillFamily.create({
                        data: {
                            name: subjectName,
                            color: getColorForIndex(i),
                            icon: 'BookOpen',
                            order: i,
                            keywords: JSON.stringify([subjectName.toLowerCase()]),
                            isActive: true,
                            autoDetect: true,
                        },
                    });
                }

                skillsData.push({
                    id: skillFamily.id,
                    name: subjectName,
                    level: 0,
                    xp: 0,
                    color: skillFamily.color,
                });
            }
            return skillsData;
        }

        // S'il y a de la progression, on la formate
        const skillsData: UserSkillData[] = progressList.map(p => {
            const isDetail = !!p.skillDetail;
            return {
                id: isDetail ? p.skillDetail!.id : p.skillFamily.id,
                name: isDetail ? p.skillDetail!.name : p.skillFamily.name,
                level: p.level,
                xp: p.xp,
                // Si pas de couleur spécifique, prendre celle de la famille
                color: p.skillFamily.color || getColorForIndex(0),
            };
        });

        // Retirer les doublons si besoin (ex: famille + détail avec même nom) et trier
        const uniqueSkills = Array.from(new Map(skillsData.map(item => [item.name, item])).values());

        logger.debug(`[skill-service] ${uniqueSkills.length} compétences récupérées dynamiquement pour userId: ${userId}`);
        return uniqueSkills.sort((a, b) => b.level - a.level);

    } catch (error) {
        logger.error('[skill-service] Erreur getUserSkillsFromProfile:', error);
        return [];
    }
}

/**
 * Met à jour les compétences quand les matières du profil changent
 */
export async function syncSkillsWithProfile(userId: string): Promise<void> {
    try {
        const preferences = await prisma.userPreferences.findUnique({
            where: { userId },
        });

        if (!preferences || !preferences.studySubjects) {
            return;
        }

        const subjects = preferences.studySubjects;

        // Pour chaque matière, s'assurer qu'une SkillFamily existe
        for (let i = 0; i < subjects.length; i++) {
            const subjectName = subjects[i];

            const existing = await prisma.skillFamily.findFirst({
                where: { name: subjectName },
            });

            if (!existing) {
                await prisma.skillFamily.create({
                    data: {
                        name: subjectName,
                        color: getColorForIndex(i),
                        icon: 'BookOpen',
                        order: i,
                        keywords: JSON.stringify([subjectName.toLowerCase()]),
                        isActive: true,
                        autoDetect: true,
                    },
                });
                logger.info(`[skill-service] Sync: créé SkillFamily pour "${subjectName}"`);
            }
        }
    } catch (error) {
        logger.error('[skill-service] Erreur syncSkillsWithProfile:', error);
    }
}
