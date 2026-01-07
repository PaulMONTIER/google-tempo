import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { seedSkillFamilies } from '@/lib/gamification/seed-skills';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/gamification/skills/seed
 * Seed les familles de compétences prédéfinies
 * Réservé au développement
 */
export async function POST() {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // En production, on pourrait limiter à certains utilisateurs
        // Pour l'instant, on autorise tous les utilisateurs authentifiés

        logger.info('[API /skills/seed] Démarrage du seed des compétences');

        const result = await seedSkillFamilies();

        return NextResponse.json({
            success: true,
            message: `Seed terminé: ${result.created} créées, ${result.updated} mises à jour`,
            ...result,
        });
    } catch (error) {
        logger.error('[API /skills/seed] Erreur:', error);
        return NextResponse.json(
            { error: 'Erreur lors du seed des compétences' },
            { status: 500 }
        );
    }
}
