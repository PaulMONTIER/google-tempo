import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getCalendarClient } from '@/lib/calendar/oauth-client';
import { format, parseISO, addHours } from 'date-fns';
import type { calendar_v3 } from 'googleapis';

/**
 * Exécute un outil calendrier pour Gemini Live
 * Appelé par le client quand Gemini demande un function call
 */
export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { toolName, args } = body;

        if (!toolName) {
            return NextResponse.json(
                { error: 'Nom de l\'outil requis' },
                { status: 400 }
            );
        }

        // Récupérer le client Google Calendar
        const calendar = await getCalendarClient(session.user.id);
        if (!calendar) {
            return NextResponse.json(
                { error: 'Impossible de se connecter à Google Calendar' },
                { status: 500 }
            );
        }

        let result: unknown;

        switch (toolName) {
            case 'get_events': {
                const { startDate, endDate } = args;
                const response = await calendar.events.list({
                    calendarId: 'primary',
                    timeMin: new Date(startDate).toISOString(),
                    timeMax: new Date(endDate + 'T23:59:59').toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults: 20
                });

                const events = response.data.items?.map((event: calendar_v3.Schema$Event) => ({
                    id: event.id,
                    title: event.summary,
                    start: event.start?.dateTime || event.start?.date,
                    end: event.end?.dateTime || event.end?.date,
                    description: event.description
                })) || [];

                result = {
                    success: true,
                    events,
                    count: events.length
                };
                break;
            }

            case 'create_event': {
                const { title, startDateTime, endDateTime, description } = args;

                // Calculer endDateTime si non fourni (défaut: 1 heure après le début)
                const start = parseISO(startDateTime);
                const end = endDateTime ? parseISO(endDateTime) : addHours(start, 1);

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: {
                        summary: title,
                        description: description || '',
                        start: {
                            dateTime: start.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        end: {
                            dateTime: end.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        }
                    }
                });

                result = {
                    success: true,
                    eventId: response.data.id,
                    title: response.data.summary,
                    start: response.data.start?.dateTime,
                    end: response.data.end?.dateTime,
                    message: `Événement "${title}" créé avec succès`
                };
                break;
            }

            case 'delete_event': {
                const { eventId } = args;

                // D'abord récupérer l'événement pour avoir son nom
                const eventResponse = await calendar.events.get({
                    calendarId: 'primary',
                    eventId: eventId
                });
                const eventTitle = eventResponse.data.summary;

                await calendar.events.delete({
                    calendarId: 'primary',
                    eventId: eventId
                });

                result = {
                    success: true,
                    message: `Événement "${eventTitle}" supprimé avec succès`
                };
                break;
            }

            case 'find_free_slots': {
                const { date, duration } = args;
                const dayStart = new Date(date + 'T08:00:00');
                const dayEnd = new Date(date + 'T20:00:00');

                // Récupérer les événements du jour
                const response = await calendar.events.list({
                    calendarId: 'primary',
                    timeMin: dayStart.toISOString(),
                    timeMax: dayEnd.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime'
                });

                const events = response.data.items || [];
                const freeSlots: { start: string; end: string }[] = [];
                let currentTime = dayStart;

                for (const event of events) {
                    const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
                    const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');

                    // S'il y a un créneau libre avant cet événement
                    if (currentTime < eventStart) {
                        const gapMinutes = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);
                        if (gapMinutes >= duration) {
                            freeSlots.push({
                                start: format(currentTime, 'HH:mm'),
                                end: format(eventStart, 'HH:mm')
                            });
                        }
                    }
                    currentTime = eventEnd > currentTime ? eventEnd : currentTime;
                }

                // Vérifier le créneau après le dernier événement
                if (currentTime < dayEnd) {
                    const gapMinutes = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
                    if (gapMinutes >= duration) {
                        freeSlots.push({
                            start: format(currentTime, 'HH:mm'),
                            end: format(dayEnd, 'HH:mm')
                        });
                    }
                }

                result = {
                    success: true,
                    date,
                    duration,
                    freeSlots,
                    message: freeSlots.length > 0
                        ? `${freeSlots.length} créneau(x) disponible(s) de ${duration} minutes`
                        : `Aucun créneau de ${duration} minutes disponible`
                };
                break;
            }

            default:
                return NextResponse.json(
                    { error: `Outil inconnu: ${toolName}` },
                    { status: 400 }
                );
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('[Voice Execute Tool] Erreur:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors de l\'exécution de l\'outil' },
            { status: 500 }
        );
    }
}
