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
        // 1. Récupérer les préférences de l'utilisateur (matières choisies)
        const preferences = await prisma.userPreferences.findUnique({
            where: { userId },
        });

        if (!preferences || !preferences.studySubjects || preferences.studySubjects.length === 0) {
            logger.debug(`[skill-service] Aucune matière dans le profil pour userId: ${userId}`);
            return [];
        }

        const subjects = preferences.studySubjects;
        const skillsData: UserSkillData[] = [];

        // 2. Pour chaque matière, créer ou récupérer la compétence correspondante
        for (let i = 0; i < subjects.length; i++) {
            const subjectName = subjects[i];

            // Chercher ou créer la famille de compétences pour cette matière
            let skillFamily = await prisma.skillFamily.findFirst({
                where: {
                    name: subjectName,
                    // Compétence spécifique à cet utilisateur via une convention de nommage
                },
            });

            // Si pas de famille, on en crée une dynamiquement
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
                logger.debug(`[skill-service] Créé SkillFamily pour "${subjectName}"`);
            }

            // Récupérer la progression de l'utilisateur pour cette compétence
            const progress = await prisma.userSkillProgress.findFirst({
                where: {
                    userId,
                    skillFamilyId: skillFamily.id,
                    skillDetailId: null,
                },
            });

            skillsData.push({
                id: skillFamily.id,
                name: subjectName,
                level: progress?.level || 0,
                xp: progress?.xp || 0,
                color: skillFamily.color,
            });
        }

        logger.debug(`[skill-service] ${skillsData.length} compétences récupérées depuis le profil pour userId: ${userId}`);

        return skillsData;
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
