import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { getUserSkillsFromProfile } from '@/lib/gamification/profile-skills-service';
import { getSkillFamilyDetails } from '@/lib/gamification/skill-service';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/gamification/skills
 * Récupère les compétences DYNAMIQUES basées sur les matières du profil
 * Query params:
 *   - familyId?: string - Si fourni, retourne uniquement les détails de cette famille
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;
    const { searchParams } = new URL(req.url);
    const familyId = searchParams.get('familyId');

    logger.debug(`[API /gamification/skills] GET pour userId: ${userId}, familyId: ${familyId || 'all'}`);

    if (familyId) {
      // Récupérer uniquement les détails d'une famille
      const familyDetails = await getSkillFamilyDetails(userId, familyId);

      if (!familyDetails) {
        return NextResponse.json(
          {
            error: 'Famille de compétences non trouvée',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: familyDetails,
      });
    }

    // Récupérer les compétences DEPUIS LE PROFIL (plus de hardcoding)
    const skills = await getUserSkillsFromProfile(userId);

    return NextResponse.json({
      success: true,
      data: skills,
    });
  } catch (error: unknown) {
    logger.error('[API /gamification/skills] Erreur GET:', error);
    return handleApiError(error, 'gamification-skills');
  }
}
