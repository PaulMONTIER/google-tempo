import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { generateRevisionPlan } from '@/lib/services/revision-planner';

/**
 * POST /api/revision/generate
 * Génère un programme de révision personnalisé
 * Body: { eventTitle, eventDate, documents?: DriveFileContent[] }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { eventTitle, eventDate, documents, sessionsCount, sessionDuration, includeQCM } = body;

        if (!eventTitle || !eventDate) {
            return NextResponse.json(
                { error: 'eventTitle et eventDate requis' },
                { status: 400 }
            );
        }
        // La validation stricte de date dans le futur est retirée 
        // pour permettre la flexibilité (ex: tester avec des dates passées).


        console.log(`[Revision Generate] Creating plan for "${eventTitle}" on ${eventDate}`);
        console.log(`[Revision Generate] Config received: sessionsCount=${sessionsCount}, sessionDuration=${sessionDuration}, includeQCM=${includeQCM}`);

        const plan = await generateRevisionPlan(
            session.user.id,
            eventTitle,
            eventDate,
            documents,
            {
                sessionsCount,
                sessionDuration,
                includeQCM
            }
        );

        console.log(`[Revision Generate] Generated ${plan.sessions.length} sessions`);

        return NextResponse.json({
            success: true,
            plan,
            message: `Programme de ${plan.sessions.length} sessions créé sur ${plan.totalDays} jours.`,
        });

    } catch (error: any) {
        console.error('[Revision Generate] Error:', error);

        return NextResponse.json(
            { error: 'Erreur lors de la génération du programme', details: error.message },
            { status: 500 }
        );
    }
}
