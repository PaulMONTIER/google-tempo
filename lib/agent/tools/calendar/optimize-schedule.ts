import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { listCalendarEvents } from '@/lib/calendar';
import { validateUserId } from '../utils/user-validator';
import { logger } from '@/lib/utils/logger';
import { differenceInMinutes, format } from 'date-fns';

export const optimizeScheduleTool = tool(
    async ({ targetDate }, config) => {
        logger.info(`[optimizeScheduleTool] Début de l’optimisation pour la date : ${targetDate}`);

        try {
            const userId = validateUserId(config);

            // Fetch events for the target day
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const events = await listCalendarEvents(userId, {
                startDate: startOfDay,
                endDate: endOfDay,
                maxResults: 50
            });

            if (!events || events.length === 0) {
                return JSON.stringify({
                    success: true,
                    message: "Ta journée est complètement libre ! Tu peux planifier ce que tu veux : Deep Work, Sport, ou Lecture.",
                    suggestions: []
                });
            }

            // Simple logic: find gaps between events
            const suggestions = [];

            // Sort events by start time
            const sortedEvents = [...events]
                .filter(e => e.startDate && e.endDate)
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

            // Check for gaps
            for (let i = 0; i < sortedEvents.length - 1; i++) {
                const currentEvent = sortedEvents[i];
                const nextEvent = sortedEvents[i + 1];

                const currentEnd = currentEvent.endDate;
                const nextStart = nextEvent.startDate;

                const gapMinutes = differenceInMinutes(nextStart, currentEnd);

                if (gapMinutes >= 30 && gapMinutes <= 120) {
                    suggestions.push({
                        time: format(currentEnd, "HH:mm"),
                        duration: gapMinutes,
                        type: "Pause / Micro-learning",
                        reason: `Tu as un trou de ${gapMinutes} minutes entre '${currentEvent.title}' et '${nextEvent.title}'.`
                    });
                }
            }

            // Check for back-to-back (burnout risk)
            let backToBackCount = 0;
            for (let i = 0; i < sortedEvents.length - 1; i++) {
                const currentEnd = sortedEvents[i].endDate;
                const nextStart = sortedEvents[i + 1].startDate;
                if (differenceInMinutes(nextStart, currentEnd) < 15) {
                    backToBackCount++;
                } else {
                    backToBackCount = 0;
                }
                if (backToBackCount >= 3) {
                    suggestions.push({
                        time: format(currentEnd, "HH:mm"),
                        type: "Alerte Burnout",
                        reason: "Tu as enchaîné plus de 3 événements sans pause. Je te conseille d'ajouter un bloc de 15min pour respirer."
                    });
                }
            }

            if (suggestions.length === 0) {
                return JSON.stringify({
                    success: true,
                    message: "Ton planning semble équilibré aujourd'hui. Pense juste à bien t'hydrater !"
                });
            }

            return JSON.stringify({
                success: true,
                message: `Voici quelques suggestions pour optimiser ta journée :\n` + suggestions.map(s => `- ${s.time} : ${s.type} (${s.reason})`).join('\n'),
                suggestions
            });

        } catch (error: any) {
            logger.error('[optimizeScheduleTool] Erreur:', error);
            return JSON.stringify({
                success: false,
                error: `Erreur lors de l'analyse du planning: ${error.message}`
            });
        }
    },
    {
        name: 'optimize_schedule',
        description: `Analyse une journée spécifique pour proposer des optimisations proactives (pauses, deep work, correction de surchauffe).
À utiliser le matin, quand l'utilisateur demande "optimise ma journée", ou quand tu constates un planning trop chargé.`,
        schema: z.object({
            targetDate: z.string().describe("La date cible à analyser au format YYYY-MM-DD")
        }),
    }
);
