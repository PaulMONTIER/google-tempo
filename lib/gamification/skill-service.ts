import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export interface SkillFamilyData {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  level: number; // 0-100 pour le radar chart
  xp: number;
  details: SkillDetailData[];
}

export interface SkillDetailData {
  id: string;
  name: string;
  description: string | null;
  level: number;
  xp: number;
}

/**
 * Récupère toutes les compétences d'un utilisateur avec leurs niveaux
 */
export async function getUserSkills(userId: string): Promise<SkillFamilyData[]> {
  try {
    // Récupérer toutes les familles de compétences actives
    const families = await prisma.skillFamily.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        details: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    // Si pas de familles définies, retourner un tableau vide
    if (!families || families.length === 0) {
      logger.debug('Aucune famille de compétences trouvée, retour tableau vide');
      return [];
    }

  // Pour chaque famille, récupérer la progression de l'utilisateur
  const skillsData: SkillFamilyData[] = [];

  for (const family of families) {
    // Récupérer la progression au niveau famille
    const familyProgress = await prisma.userSkillProgress.findFirst({
      where: {
        userId,
        skillFamilyId: family.id,
        skillDetailId: null, // Progression au niveau famille uniquement
      },
    });

    // Récupérer les détails avec leurs progressions
    const detailsData: SkillDetailData[] = [];

    for (const detail of family.details) {
      const detailProgress = await prisma.userSkillProgress.findFirst({
        where: {
          userId,
          skillFamilyId: family.id,
          skillDetailId: detail.id,
        },
      });

      detailsData.push({
        id: detail.id,
        name: detail.name,
        description: detail.description,
        level: detailProgress?.level || 0,
        xp: detailProgress?.xp || 0,
      });
    }

    // Calculer le niveau de la famille (moyenne des détails ou niveau direct)
    let familyLevel = familyProgress?.level || 0;
    if (familyLevel === 0 && detailsData.length > 0) {
      // Si pas de niveau direct, calculer la moyenne des détails
      const avgLevel = detailsData.reduce((sum, d) => sum + d.level, 0) / detailsData.length;
      familyLevel = Math.round(avgLevel);
    }

    skillsData.push({
      id: family.id,
      name: family.name,
      color: family.color,
      icon: family.icon,
      level: familyLevel,
      xp: familyProgress?.xp || 0,
      details: detailsData,
    });
  }

    logger.debug(`[skill-service] ${skillsData.length} familles de compétences récupérées pour userId: ${userId}`);

    return skillsData;
  } catch (error) {
    logger.error('[skill-service] Erreur getUserSkills:', error);
    // En cas d'erreur, retourner un tableau vide plutôt que de crasher
    return [];
  }
}

/**
 * Récupère les détails d'une famille de compétences
 */
export async function getSkillFamilyDetails(
  userId: string,
  familyId: string
): Promise<SkillFamilyData | null> {
  const family = await prisma.skillFamily.findUnique({
    where: { id: familyId },
    include: {
      details: {
        orderBy: {
          name: 'asc',
        },
      },
    },
  });

  if (!family) {
    return null;
  }

  // Récupérer la progression au niveau famille
  const familyProgress = await prisma.userSkillProgress.findFirst({
    where: {
      userId,
      skillFamilyId: family.id,
      skillDetailId: null,
    },
  });

  // Récupérer les détails avec leurs progressions
  const detailsData: SkillDetailData[] = [];

  for (const detail of family.details) {
    const detailProgress = await prisma.userSkillProgress.findFirst({
      where: {
        userId,
        skillFamilyId: family.id,
        skillDetailId: detail.id,
      },
    });

    detailsData.push({
      id: detail.id,
      name: detail.name,
      description: detail.description,
      level: detailProgress?.level || 0,
      xp: detailProgress?.xp || 0,
    });
  }

  let familyLevel = familyProgress?.level || 0;
  if (familyLevel === 0 && detailsData.length > 0) {
    const avgLevel = detailsData.reduce((sum, d) => sum + d.level, 0) / detailsData.length;
    familyLevel = Math.round(avgLevel);
  }

  return {
    id: family.id,
    name: family.name,
    color: family.color,
    icon: family.icon,
    level: familyLevel,
    xp: familyProgress?.xp || 0,
    details: detailsData,
  };
}

/**
 * Met à jour le niveau d'une compétence (famille ou détail)
 */
export async function updateSkillLevel(
  userId: string,
  skillFamilyId: string,
  level: number,
  skillDetailId?: string
): Promise<void> {
  await prisma.userSkillProgress.upsert({
    where: {
      userId_skillFamilyId_skillDetailId: {
        userId,
        skillFamilyId,
        skillDetailId: skillDetailId || null,
      },
    },
    create: {
      userId,
      skillFamilyId,
      skillDetailId: skillDetailId || null,
      level: Math.max(0, Math.min(100, level)), // Clamp entre 0 et 100
      xp: 0,
      lastActivityAt: new Date(),
    },
    update: {
      level: Math.max(0, Math.min(100, level)),
      lastActivityAt: new Date(),
    },
  });

  logger.debug(
    `[skill-service] Niveau mis à jour pour userId: ${userId}, familyId: ${skillFamilyId}, detailId: ${skillDetailId || 'none'}, level: ${level}`
  );
}


