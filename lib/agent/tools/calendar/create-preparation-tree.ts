import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createCalendarEvent } from "@/lib/calendar";
import { validateUserId } from "../utils/user-validator";
import { handleToolError } from "../utils/error-handler";
import { logger } from "@/lib/utils/logger";
import { treeService } from "@/lib/services/tree-service";
import { addDays, format, setHours, setMinutes } from "date-fns";

/**
 * Outil pour créer un arbre de préparation complet
 * Crée l'objectif (exam) + toutes les séances de révision en une seule fois
 */
export const createPreparationTreeTool = tool(
    async (input, config) => {
        try {
            const userId = validateUserId(config);

            logger.info(`[createPreparationTreeTool] 🌳 Creating tree for: ${input.goalTitle}`);

            // 1. Créer l'événement objectif (exam)
            const goalEvent = await createCalendarEvent(userId, {
                summary: input.goalTitle,
                description: input.goalDescription || `Objectif: ${input.goalTitle}`,
                start: {
                    dateTime: input.goalDateTime,
                    timeZone: "Europe/Paris",
                },
                end: {
                    dateTime: new Date(new Date(input.goalDateTime).getTime() + (input.goalDurationMinutes || 120) * 60000).toISOString(),
                    timeZone: "Europe/Paris",
                },
                reminders: {
                    useDefault: false,
                    overrides: [{ method: "popup" as const, minutes: 60 }],
                },
            });

            if (!goalEvent.id) {
                throw new Error("Impossible de créer l'événement objectif");
            }

            // 2. Créer l'arbre en base de données
            const treeId = `tree_${Date.now()}`;
            const tree = await treeService.findOrCreateTree(userId, treeId, {
                goalEventId: goalEvent.id,
                goalTitle: input.goalTitle,
                goalDate: new Date(input.goalDateTime),
                detectionMethod: 'agent'
            });

            logger.info(`[createPreparationTreeTool] ✅ Tree created: ${tree.treeId}`);

            // 3. Créer les séances de préparation
            const createdBranches = [];
            for (let i = 0; i < input.sessions.length; i++) {
                const session = input.sessions[i];

                const branchEvent = await createCalendarEvent(userId, {
                    summary: session.title,
                    description: `Préparation pour: ${input.goalTitle}`,
                    start: {
                        dateTime: session.dateTime,
                        timeZone: "Europe/Paris",
                    },
                    end: {
                        dateTime: new Date(new Date(session.dateTime).getTime() + (session.durationMinutes || 60) * 60000).toISOString(),
                        timeZone: "Europe/Paris",
                    },
                    reminders: {
                        useDefault: false,
                        overrides: [{ method: "popup" as const, minutes: 15 }],
                    },
                });

                if (branchEvent.id) {
                    await treeService.addBranch({
                        treeId: tree.treeId,
                        branchEventId: branchEvent.id,
                        branchTitle: session.title,
                        branchDate: new Date(session.dateTime),
                        order: i + 1
                    });

                    createdBranches.push({
                        title: session.title,
                        date: session.dateTime
                    });

                    logger.info(`[createPreparationTreeTool] 📚 Branch ${i + 1} created: ${session.title}`);
                }
            }

            return JSON.stringify({
                success: true,
                tree: {
                    id: tree.id,
                    goalTitle: input.goalTitle,
                    goalDate: input.goalDateTime,
                    branches: createdBranches
                },
                message: `🌳 Arbre de préparation créé : "${input.goalTitle}" avec ${createdBranches.length} séances de révision`
            });

        } catch (error: any) {
            logger.error("[createPreparationTreeTool] Error:", error);
            return handleToolError(error, "createPreparationTreeTool", "Impossible de créer l'arbre de préparation");
        }
    },
    {
        name: "create_preparation_tree",
        description: "Crée un arbre de préparation complet avec un objectif (exam/contrôle) et plusieurs séances de révision. Utilise cet outil quand l'utilisateur demande de planifier des révisions pour un examen.",
        schema: z.object({
            goalTitle: z.string().describe("Titre de l'objectif (ex: 'Exam de Maths')"),
            goalDateTime: z.string().describe("Date et heure de l'objectif au format ISO 8601"),
            goalDurationMinutes: z.number().optional().describe("Durée de l'objectif en minutes (défaut: 120)"),
            goalDescription: z.string().optional().describe("Description de l'objectif"),
            sessions: z.array(z.object({
                title: z.string().describe("Titre de la séance (ex: 'Révision Chapitre 1')"),
                dateTime: z.string().describe("Date et heure de la séance au format ISO 8601"),
                durationMinutes: z.number().optional().describe("Durée en minutes (défaut: 60)")
            })).describe("Liste des séances de préparation")
        })
    }
);
