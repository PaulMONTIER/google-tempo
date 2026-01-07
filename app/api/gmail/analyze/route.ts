import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { fetchRecentEmails, formatEmailsForAnalysis, DetectedDeadline } from '@/lib/services/gmail-service';
import { createGeminiModel } from '@/lib/ai/model-factory';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const DEADLINE_DETECTION_PROMPT = `Tu es un assistant spécialisé dans la détection de deadlines académiques et professionnelles dans les emails.

Analyse les emails fournis et détecte UNIQUEMENT les deadlines concrètes avec des dates.

TYPES DE DEADLINES À DÉTECTER:
- Partiels / Examens / Contrôles
- Rendus de projets / Devoirs
- Réunions importantes
- Deadlines professionnelles
- Inscriptions avec date limite

IGNORER:
- Newsletters
- Publicités
- Emails sans date précise
- Confirmations de commande

RÉPONDS UNIQUEMENT EN JSON VALIDE avec ce format:
{
  "deadlines": [
    {
      "title": "Titre court de l'événement",
      "date": "YYYY-MM-DD",
      "sourceSubject": "Sujet de l'email source",
      "urgency": "high" | "medium" | "low",
      "description": "Description courte optionnelle"
    }
  ]
}

Si aucune deadline n'est trouvée, retourne: {"deadlines": []}

IMPORTANT: La date d'aujourd'hui est ${new Date().toISOString().split('T')[0]}.
Calcule les dates relatives (ex: "vendredi prochain") par rapport à cette date.`;

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json(
                { error: 'Non authentifié ou token manquant' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const days = body.days || 2;

        console.log(`[Gmail Analyze] Fetching emails from last ${days} days...`);

        // 1. Récupérer les emails récents
        const emails = await fetchRecentEmails(session.accessToken, days);

        if (emails.length === 0) {
            return NextResponse.json({
                success: true,
                deadlines: [],
                emailsAnalyzed: 0,
                message: 'Aucun email récent trouvé.',
            });
        }

        console.log(`[Gmail Analyze] Found ${emails.length} emails, analyzing...`);

        // 2. Formater pour l'IA
        const emailsText = formatEmailsForAnalysis(emails);

        // 3. Analyser avec Gemini
        const model = createGeminiModel({ temperature: 0 });

        const response = await model.invoke([
            new SystemMessage(DEADLINE_DETECTION_PROMPT),
            new HumanMessage(`Voici les emails à analyser:\n\n${emailsText}`),
        ]);

        // 4. Parser la réponse
        const content = response.content as string;

        // Extraire le JSON de la réponse
        let deadlines: DetectedDeadline[] = [];
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                deadlines = parsed.deadlines || [];
            }
        } catch (parseError) {
            console.error('[Gmail Analyze] Error parsing AI response:', parseError);
            console.log('[Gmail Analyze] Raw response:', content);
        }

        console.log(`[Gmail Analyze] Detected ${deadlines.length} deadlines`);

        // 5. Enrichissement proactif (Optionnel mais recommandé)
        if (deadlines.length > 0) {
            const { contentAgent } = await import('@/lib/agents/content-agent');
            await Promise.all(deadlines.map(async (d) => {
                try {
                    d.suggestedResources = await contentAgent.quickEnrich(d.title);
                } catch (e) {
                    console.error(`Failed to enrich deadline: ${d.title}`, e);
                }
            }));
        }

        return NextResponse.json({
            success: true,
            deadlines,
            emailsAnalyzed: emails.length,
            message: deadlines.length > 0
                ? `${deadlines.length} deadline(s) détectée(s) dans vos emails.`
                : 'Aucune deadline détectée dans vos emails récents.',
        });

    } catch (error: any) {
        console.error('[Gmail Analyze] Error:', error);

        // Vérifier si c'est une erreur d'autorisation Gmail
        if (error.code === 403 || error.message?.includes('insufficientPermissions')) {
            return NextResponse.json(
                {
                    error: 'Accès Gmail non autorisé. Veuillez vous reconnecter pour autoriser l\'accès à vos emails.',
                    needsReauth: true
                },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors de l\'analyse des emails', details: error.message },
            { status: 500 }
        );
    }
}
