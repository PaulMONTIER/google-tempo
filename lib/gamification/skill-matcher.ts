import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export interface SkillMatch {
    familyId: string;
    familyName: string;
    detailId?: string;
    detailName?: string;
    matchScore: number; // 0-100
}

/**
 * Détecte les compétences correspondantes à un titre d'événement
 */
export async function matchEventToSkills(eventTitle: string): Promise<SkillMatch[]> {
    const normalizedTitle = eventTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matches: SkillMatch[] = [];

    try {
        // Récupérer toutes les familles actives avec leurs détails
        const families = await prisma.skillFamily.findMany({
            where: { isActive: true, autoDetect: true },
            include: { details: true },
        });

        for (const family of families) {
            // Parser les keywords de la famille
            let familyKeywords: string[] = [];
            try {
                familyKeywords = JSON.parse(family.keywords);
            } catch {
                familyKeywords = [];
            }

            // Vérifier les keywords de la famille
            let familyScore = 0;
            for (const keyword of familyKeywords) {
                const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (normalizedTitle.includes(normalizedKeyword)) {
                    familyScore += 20;
                }
            }

            // Vérifier les détails
            let bestDetail: { id: string; name: string; score: number } | null = null;

            for (const detail of family.details) {
                let detailKeywords: string[] = [];
                try {
                    detailKeywords = JSON.parse(detail.keywords);
                } catch {
                    detailKeywords = [];
                }

                let detailScore = 0;
                for (const keyword of detailKeywords) {
                    const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    if (normalizedTitle.includes(normalizedKeyword)) {
                        detailScore += 30;
                    }
                }

                if (detailScore > 0 && (!bestDetail || detailScore > bestDetail.score)) {
                    bestDetail = { id: detail.id, name: detail.name, score: detailScore };
                }
            }

            // Calculer le score total
            const totalScore = Math.min(100, familyScore + (bestDetail?.score || 0));

            if (totalScore > 0) {
                matches.push({
                    familyId: family.id,
                    familyName: family.name,
                    detailId: bestDetail?.id,
                    detailName: bestDetail?.name,
                    matchScore: totalScore,
                });
            }
        }

        // Trier par score décroissant
        matches.sort((a, b) => b.matchScore - a.matchScore);

        logger.debug(`[skill-matcher] "${eventTitle}" → ${matches.length} matches trouvés`);

        return matches;
    } catch (error) {
        logger.error('[skill-matcher] Erreur matchEventToSkills:', error);
        return [];
    }
}

/**
 * Ajoute de l'XP à une compétence pour un utilisateur
 */
export async function grantSkillXp(
    userId: string,
    skillFamilyId: string,
    xpAmount: number,
    skillDetailId?: string
): Promise<void> {
    try {
        // Upsert de la progression au niveau famille
        const existingFamilyProgress = await prisma.userSkillProgress.findFirst({
            where: { userId, skillFamilyId, skillDetailId: null },
        });

        if (existingFamilyProgress) {
            await prisma.userSkillProgress.update({
                where: { id: existingFamilyProgress.id },
                data: {
                    xp: { increment: xpAmount },
                    level: calculateLevel(existingFamilyProgress.xp + xpAmount),
                    lastActivityAt: new Date(),
                },
            });
        } else {
            await prisma.userSkillProgress.create({
                data: {
                    userId,
                    skillFamilyId,
                    skillDetailId: null,
                    xp: xpAmount,
                    level: calculateLevel(xpAmount),
                    lastActivityAt: new Date(),
                },
            });
        }

        // Si un détail est spécifié, update aussi
        if (skillDetailId) {
            await prisma.userSkillProgress.upsert({
                where: {
                    userId_skillFamilyId_skillDetailId: {
                        userId,
                        skillFamilyId,
                        skillDetailId,
                    },
                },
                create: {
                    userId,
                    skillFamilyId,
                    skillDetailId,
                    xp: xpAmount,
                    level: calculateLevel(xpAmount),
                    lastActivityAt: new Date(),
                },
                update: {
                    xp: { increment: xpAmount },
                    lastActivityAt: new Date(),
                },
            });

            // Recalculer le niveau du détail
            const detailProgress = await prisma.userSkillProgress.findFirst({
                where: { userId, skillFamilyId, skillDetailId },
            });
            if (detailProgress) {
                await prisma.userSkillProgress.update({
                    where: { id: detailProgress.id },
                    data: { level: calculateLevel(detailProgress.xp) },
                });
            }
        }

        logger.debug(`[skill-matcher] +${xpAmount} XP pour familyId=${skillFamilyId}, detailId=${skillDetailId || 'N/A'}`);
    } catch (error) {
        logger.error('[skill-matcher] Erreur grantSkillXp:', error);
    }
}

/**
 * Calcule le niveau (0-100) basé sur l'XP
 * Formule : sqrt(xp / 10) plafonné à 100
 */
function calculateLevel(xp: number): number {
    // 0 XP = 0%, 1000 XP = 100%
    const level = Math.floor(Math.sqrt(xp / 10) * 10);
    return Math.min(100, Math.max(0, level));
}

/**
 * Traite un événement et attribue l'XP aux compétences correspondantes
 */
export async function processEventForSkills(
    userId: string,
    eventTitle: string,
    durationMinutes: number
): Promise<SkillMatch[]> {
    // Trouver les compétences correspondantes
    const matches = await matchEventToSkills(eventTitle);

    if (matches.length === 0) {
        logger.debug(`[skill-matcher] Aucune compétence matchée pour "${eventTitle}"`);
        return [];
    }

    // Calculer l'XP : durée (min) × 0.5, max selon le score
    const baseXp = Math.round(durationMinutes * 0.5);

    // Attribuer XP aux top matches (max 2)
    const topMatches = matches.slice(0, 2);

    for (const match of topMatches) {
        const xpForSkill = Math.round(baseXp * (match.matchScore / 100));
        await grantSkillXp(userId, match.familyId, xpForSkill, match.detailId);
    }

    logger.info(`[skill-matcher] Événement "${eventTitle}" → ${topMatches.length} compétences, ${baseXp} XP base`);

    return topMatches;
}
