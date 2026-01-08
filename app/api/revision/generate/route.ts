import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { generateRevisionPlan } from '@/lib/services/revision-planner';

/**
 * POST /api/revision/generate
 * Génère un programme de révision personnalisé avec streaming de progression
 * Body: { eventTitle, eventDate, documents?: DriveFileContent[], stream?: boolean }
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
        const { eventTitle, eventDate, documents, sessionsCount, sessionDuration, includeQCM, stream } = body;

        if (!eventTitle || !eventDate) {
            return NextResponse.json(
                { error: 'eventTitle et eventDate requis' },
                { status: 400 }
            );
        }

        // Vérifier que la date est dans le futur
        const targetDate = new Date(eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (targetDate <= today) {
            return NextResponse.json(
                { error: 'La date de l\'événement doit être dans le futur' },
                { status: 400 }
            );
        }

        console.log(`[Revision Generate] Creating plan for "${eventTitle}" on ${eventDate}`);
        console.log(`[Revision Generate] Config received: sessionsCount=${sessionsCount}, sessionDuration=${sessionDuration}, includeQCM=${includeQCM}, stream=${stream}`);

        // Si streaming demandé, utiliser un ReadableStream
        if (stream) {
            const encoder = new TextEncoder();

            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        // Envoyer les étapes de progression
                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'progress',
                            step: 1,
                            message: 'Analyse du calendrier...'
                        }) + '\n'));

                        // Petit délai pour l'UX
                        await new Promise(r => setTimeout(r, 500));

                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'progress',
                            step: 2,
                            message: 'Génération du programme IA...'
                        }) + '\n'));

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

                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'progress',
                            step: 3,
                            message: 'Finalisation...'
                        }) + '\n'));

                        // Envoyer le résultat final
                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'result',
                            success: true,
                            plan,
                            message: `Programme de ${plan.sessions.length} sessions créé sur ${plan.totalDays} jours.`,
                        }) + '\n'));

                        controller.close();
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'error',
                            error: errorMessage
                        }) + '\n'));
                        controller.close();
                    }
                }
            });

            return new Response(readableStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Comportement classique (sans streaming)
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

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('[Revision Generate] Error:', error);

        return NextResponse.json(
            { error: 'Erreur lors de la génération du programme', details: errorMessage },
            { status: 500 }
        );
    }
}
