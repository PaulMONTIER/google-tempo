import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { events } = await request.json();

    if (!events || events.length === 0) {
      return NextResponse.json({ trees: [] });
    }

    // Format events for the LLM
    const eventsText = events.map((e: any) => {
      const startDate = new Date(e.start);
      return `- "${e.title}" le ${startDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })} (id: ${e.id})`;
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

    const response = await model.invoke(prompt);

    // Parse the response
    let content = response.content as string;

    // Clean up the response (remove markdown code blocks if present)
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("[analyze-trees] Failed to parse LLM response:", content);
      return NextResponse.json({ trees: [] });
    }

  } catch (error: any) {
    console.error("[analyze-trees] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur d'analyse" },
      { status: 500 }
    );
  }
}
