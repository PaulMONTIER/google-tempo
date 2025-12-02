import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/api/session-service";
import { createGeminiModel } from "@/lib/ai/model-factory";
import { formatDateForLLM } from "@/lib/utils/date-formatters";
import { logger } from "@/lib/utils/logger";
import { handleApiError, ApiError } from "@/lib/api/error-handler";

// Initialisation lazy pour éviter les problèmes au build
let _model: ReturnType<typeof createGeminiModel> | null = null;

function getModel() {
  if (!_model) {
    _model = createGeminiModel();
  }
  return _model;
}

export async function POST(request: Request) {
  try {
    const session = await getAppSession();

    if (!session?.user?.id) {
      throw new ApiError(401, "Non authentifié", "UNAUTHORIZED");
    }

    const { events } = await request.json();

    if (!events || events.length === 0) {
      return NextResponse.json({ trees: [] });
    }

    // Format events for the LLM
    const eventsText = events.map((e: any) => {
      const startDate = new Date(e.start);
      return `- "${e.title}" le ${formatDateForLLM(startDate)} (id: ${e.id})`;
    }).join('\n');

    const prompt = `Analyse ces événements de calendrier et identifie les "arbres de préparation".

Un arbre de préparation c'est :
- Un événement OBJECTIF (contrôle, examen, présentation, deadline, rendu, soutenance, etc.)
- Des événements de PRÉPARATION liés (révision, étude, exercice, lecture, préparation, etc.)

ÉVÉNEMENTS :
${eventsText}

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "trees": [
    {
      "goalId": "id de l'événement objectif",
      "goalTitle": "titre de l'objectif",
      "branchIds": ["id1", "id2", ...] // IDs des événements de préparation liés
    }
  ]
}

Règles :
- Ne crée un arbre que s'il y a AU MOINS 1 événement de préparation lié à un objectif
- Les événements de préparation doivent être AVANT ou LE JOUR de l'objectif
- Associe les événements par sujet/thème similaire (math, anglais, projet X, etc.)
- Si aucun arbre n'est détecté, renvoie {"trees": []}
- Renvoie UNIQUEMENT le JSON, pas de texte autour`;

    const response = await getModel().invoke(prompt);

    // Parse the response
    let content = response.content as string;

    // Clean up the response (remove markdown code blocks if present)
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (parseError) {
      logger.error("[analyze-trees] Failed to parse LLM response:", content);
      // Retourner un tableau vide plutôt qu'une erreur pour ce cas spécifique
      return NextResponse.json({ trees: [] });
    }

  } catch (error: unknown) {
    logger.error("[analyze-trees] Error:", error);
    return handleApiError(error, "analyze-trees");
  }
}
