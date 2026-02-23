import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { searchSimilarDocuments } from '@/lib/rag/vector-store';
import { logger } from '@/lib/utils/logger';

export const searchPersonalKnowledgeTool = tool(
    async ({ query, userId }) => {
        logger.info(`[searchPersonalKnowledgeTool] Recherche lancée : "${query}" pour userId: ${userId}`);

        try {
            // Validate the query
            if (!query || query.trim() === '') {
                throw new Error("La requête de recherche ne peut pas être vide.");
            }

            // Search the vector store, filtering by userId if possible
            const results = await searchSimilarDocuments(query, 4, { userId });

            if (!results || results.length === 0) {
                logger.info('[searchPersonalKnowledgeTool] Aucun document pertinent trouvé.');
                return JSON.stringify({
                    success: true,
                    message: "Aucune information pertinente trouvée dans tes documents personnels pour cette requête.",
                    results: []
                });
            }

            // Format results
            const formattedResults = results.map((doc: any) => ({
                content: doc.pageContent,
                source: doc.metadata?.title || 'Document inconnu',
                fileId: doc.metadata?.fileId,
            }));

            logger.info(`[searchPersonalKnowledgeTool] ${formattedResults.length} extraits trouvés.`);

            return JSON.stringify({
                success: true,
                message: `Trouvé ${formattedResults.length} extraits pertinents.`,
                results: formattedResults
            });

        } catch (error: any) {
            logger.error('[searchPersonalKnowledgeTool] Erreur:', error);
            return JSON.stringify({
                success: false,
                error: `Erreur lors de la recherche dans les documents: ${error.message}`
            });
        }
    },
    {
        name: 'search_personal_knowledge',
        description: `Recherche dans la base de connaissances personnelle de l'utilisateur (documents Drive importés, cours, notes).
Utilise cet outil UNIQUEMENT quand l'utilisateur pose une question sur le contenu de ses propres documents, cours ou projets personnels.
Ne l'utilise pas pour des recherches web générales ou pour interagir avec le calendrier.`,
        schema: z.object({
            query: z.string().describe("La question ou le thème à rechercher dans les documents personnels"),
            userId: z.string().describe("L'ID de l'utilisateur (à récupérer depuis le contexte/session)")
        }),
    }
);
