import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { listCalendarEvents } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";
import { CalendarEvent } from "@/types";
import { getHours, startOfMonth, endOfMonth } from "date-fns";

/**
 * Outil pour filtrer les événements par critères multiples
 */
export const filterEventsTool = tool(
    async (input, config) => {
        try {
            const userId = validateUserId(config);

            logger.debug(`\n🔍 [filterEventsTool] Filtering with:`, input);

            // Période : mois spécifique ou 1 an
            let startDate: Date;
            let endDate: Date;

            if (input.month && input.year) {
                startDate = startOfMonth(new Date(input.year, input.month - 1));
                endDate = endOfMonth(new Date(input.year, input.month - 1));
            } else {
                const now = new Date();
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            }

            const allEvents = await listCalendarEvents(userId, {
                startDate,
                endDate,
                maxResults: 500,
            });

            logger.debug(`   Found ${allEvents.length} events`);

            let filtered = allEvents;

            // Filtre par titre
            if (input.title) {
                const search = input.title.toLowerCase();
                filtered = filtered.filter((e: CalendarEvent) =>
                    e.title.toLowerCase().includes(search)
                );
            }

            // Filtre par heure
            if (input.hour !== undefined) {
                filtered = filtered.filter((e: CalendarEvent) => {
                    return getHours(new Date(e.startDate)) === input.hour;
                });
            }

            logger.debug(`✅ Filtered: ${filtered.length} events`);

            return JSON.stringify({
                success: true,
                count: filtered.length,
                events: filtered.map((e: CalendarEvent) => ({
                    id: e.id,
                    title: e.title,
                    startDate: e.startDate,
                    endDate: e.endDate,
                })),
            });
        } catch (error: any) {
            return handleToolError(error, "filterEventsTool", "Erreur filtrage");
        }
    },
    {
        name: "filter_calendar_events",
        description: "Filtre les événements par titre et/ou heure. Retourne une liste d'IDs pour batch_delete_events.",
        schema: z.object({
            title: z.string().optional().describe("Texte contenu dans le titre"),
            hour: z.number().optional().describe("Heure de début (0-23)"),
            month: z.number().optional().describe("Mois (1-12)"),
            year: z.number().optional().describe("Année (2025)"),
        })
    }
);
