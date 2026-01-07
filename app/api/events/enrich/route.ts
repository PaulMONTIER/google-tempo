import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { contentAgent } from '@/lib/agents/content-agent';
import { updateCalendarEvent } from '@/lib/calendar/update-event';

export async function POST(request: NextRequest) {
    console.log('[API Enrich] POST request received');
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const { eventId, eventTitle, description } = await request.json();
        console.log(`[API Enrich] Request received for eventId: ${eventId}, title: ${eventTitle}`);

        if (!eventId || !eventTitle) {
            return NextResponse.json({ error: 'eventId et eventTitle sont requis' }, { status: 400 });
        }

        console.log(`[API Enrich] Enriching event: ${eventTitle} (${eventId}) using session token: ${!!session.accessToken}`);

        // 1. Fetch resources via ContentAgent
        const resources = await contentAgent.quickEnrich(eventTitle, description, session.accessToken as string);

        if (resources.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Aucune ressource trouvée pour ce sujet.'
            });
        }

        // 2. Update Google Calendar event metadata
        // We use extendedProperties.private to store our custom data
        await updateCalendarEvent(session.user.id, eventId, {
            extendedProperties: {
                private: {
                    suggestedResources: JSON.stringify(resources)
                }
            }
        });

        return NextResponse.json({
            success: true,
            resources,
            message: `${resources.length} ressources ajoutées à l'événement.`
        });

    } catch (error: any) {
        console.error('[API Enrich] Full Error:', error);
        return NextResponse.json({
            error: 'Erreur lors de l\'enrichissement',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
