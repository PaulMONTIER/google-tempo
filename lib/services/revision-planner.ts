import { createGeminiModel } from '@/lib/ai/model-factory';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { DriveFileContent, RevisionPlan, RevisionSession } from '@/types/integrations';
import { prisma } from '@/lib/prisma';
import { calendarHelpers } from '@/lib/actions/calendar-helpers';

export type { RevisionPlan, RevisionSession };

const REVISION_PLANNER_PROMPT = `Tu es un expert en planification de révisions et en apprentissage efficace (Tempo AI).

Ton rôle est de créer un programme de révision personnalisé, réaliste et optimisé pour l'étudiant.

DATAÉES D'ENTRÉE:
1. Événement cible (Examen/Partiel)
2. Créneaux disponibles (Free Slots) du calendrier
3. Préférences de l'étudiant (Durée max, heures préférées)
4. Documents de cours (Context)

RÈGLES DE PLANIFICATION STRICTES:
1. **NOMBRE DE SESSIONS OBLIGATOIRE**: Tu DOIS générer EXACTEMENT le nombre de sessions demandé. C'est NON NÉGOCIABLE.
2. **Répartition**: Distribue les sessions uniformément sur les jours disponibles.
3. **Durée des sessions**: 
   - Par défaut 1h30 à 2h.
   - Adapter si le créneau libre est plus court.
4. **Progression pédagogique**:
   - Session 1: Vue d'ensemble et Concepts Clés
   - Sessions 2-3: Approfondissement et Exercices
   - Session 4: Pratique Avancée
   - Session 5 (Dernière): Révision Finale et QCM
5. **Contenu**: Utilise les documents fournis pour nommer précisément les sessions.

FORMAT DE RÉPONSE ATTENDU (JSON UNIQUEMENT):
{
  "sessions": [
    {
      "start": "YYYY-MM-DDTHH:mm:00",
      "end": "YYYY-MM-DDTHH:mm:00",
      "title": "Titre précis de la session",
      "description": "Objectifs et ressources à utiliser",
      "type": "study" | "exercise" | "review" | "practice",
      "exercises": []
    }
  ],
  "tips": ["Conseil 1", "Conseil 2"],
  "summary": "Explication de la stratégie choisie"
}

IMPORTANT: 
- Tu DOIS générer EXACTEMENT le nombre de sessions demandé dans les contraintes.
- Ne retourne QUE du JSON valide. Pas de markdown, pas de texte avant/après.`;

/**
 * Génère un programme de révision personnalisé et intelligent
 */
export async function generateRevisionPlan(
    userId: string,
    eventTitle: string,
    eventDate: string,
    documents?: DriveFileContent[],
    config?: {
        sessionsCount?: number;
        sessionDuration?: number;
        includeQCM?: boolean;
    }
): Promise<RevisionPlan> {
    const model = createGeminiModel({ temperature: 0.2 }); // Température basse pour rigueur JSON

    // 1. Récupérer les préférences utilisateur
    const userPrefs = await prisma.userPreferences.findUnique({
        where: { userId },
    });

    const dailyLimit = 4; // Heures max par jour (hardcodé ou depuis prefs)
    const preferredDuration = config?.sessionDuration || 120; // Utiliser la config ou défaut 2h
    const targetSessionsCount = config?.sessionsCount || 5;
    const includeQCM = config?.includeQCM || false;

    // 2. Récupérer les disponibilités (Free Slots)
    const today = new Date();
    const targetDate = new Date(eventDate);

    // On cherche des créneaux entre demain et la veille de l'examen
    const planningStart = new Date(today);
    planningStart.setDate(planningStart.getDate() + 1);
    const planningEnd = new Date(targetDate);
    planningEnd.setDate(planningEnd.getDate() - 1);

    // Si le délai est trop court (ex: examen demain), on planifie pour aujourd'hui
    if (planningEnd < planningStart) {
        planningStart.setDate(today.getDate());
    }

    let freeSlots: any[] = [];
    try {
        // On récupère les créneaux libres via l'helper existant
        // Note: findFreeSlots retourne des plages horaires disponibles
        freeSlots = await calendarHelpers.findFreeSlots(userId, preferredDuration, {
            startDate: planningStart,
            endDate: planningEnd,
        });
    } catch (error) {
        console.warn('Impossible de récupérer les disponibilités, utilisation mode dégradé', error);
        // Fallback: on suppose 18h-20h libre chaque jour
    }

    // Formater les slots pour le prompt
    const slotsContext = freeSlots.length > 0
        ? JSON.stringify(freeSlots.slice(0, 20)) // Limiter pour token context
        : "Aucune disponibilité précise détectée. Suppose 18h00-20h00 libre chaque jour.";

    // 3. Construire le contexte des documents
    let documentsContext = '';
    if (documents && documents.length > 0) {
        documentsContext = `
DOCUMENTS FOURNIS:
${documents.map((doc, i) => `
--- Doc ${i + 1}: ${doc.name} ---
${doc.content.substring(0, 4000)}...
`).join('\n')}
`;
    }

    // 4. Prompt final
    const userMessage = `PLANIFICATION REQUISE:
    
ÉVÉNEMENT: ${eventTitle}
DATE CIBLE: ${eventDate}
AUJOURD'HUI: ${today.toISOString()}

DISPONIBILITÉS (FREE SLOTS):
${slotsContext}

⚠️ CONTRAINTES OBLIGATOIRES (À RESPECTER STRICTEMENT):
- Tu DOIS générer EXACTEMENT ${targetSessionsCount} sessions (ni plus, ni moins).
- Durée par session: ${preferredDuration} min
- Limite par jour: ${dailyLimit} heures
- Inclure QCM final: ${includeQCM ? 'OUI (Dernière session)' : 'NON'}

${documentsContext || 'Aucun document spécifique fourni.'}

Génère le planning JSON avec EXACTEMENT ${targetSessionsCount} sessions maintenant.`;

    try {
        const response = await model.invoke([
            new SystemMessage(REVISION_PLANNER_PROMPT),
            new HumanMessage(userMessage),
        ]);

        const content = response.content as string;

        // Nettoyage JSON (parfois le modèle met du markdown ```json ... ```)
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonString);

        // Calcul du nombre de jours total
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 5. Enrichissement via ContentAgent (Si demandé ou si docs pauvres)
        // Pour l'instant, on l'active si includeQCM est vrai ou si peu de docs
        let pedagogyPack = undefined;
        if (includeQCM || (documents && documents.length > 0)) {
            try {
                const { contentAgent } = await import('@/lib/agents/content-agent');
                pedagogyPack = await contentAgent.generatePedagogyPack({
                    courseTag: eventTitle,
                    documents: documents || []
                });
            } catch (e) {
                console.error('Content Agent failed:', e);
            }
        }

        // Fallback: Si le LLM n'a pas généré assez de sessions, on les complète
        let sessions = parsed.sessions || [];
        if (sessions.length < targetSessionsCount) {
            console.warn(`[RevisionPlanner] LLM generated only ${sessions.length} sessions, expected ${targetSessionsCount}. Generating fallback sessions.`);
            sessions = generateFallbackSessions(eventTitle, targetDate, targetSessionsCount, sessions, preferredDuration);
        }

        // Fusionner les exercices du pack dans les sessions si type="exercise"
        sessions = sessions.map((s: any) => {
            const session = {
                ...s,
                date: s.start.split('T')[0],
                duration: `${Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000)}min`
            };

            // Injecter les exercices du pack si c'est une session d'exercice et qu'elle n'en a pas
            if ((s.type === 'exercise' || s.type === 'practice') && pedagogyPack?.exercises) {
                if (!session.exercises || session.exercises.length === 0) {
                    session.exercises = pedagogyPack.exercises;
                }
            }

            return session;
        });

        return {
            eventTitle,
            eventDate,
            totalDays: diffDays,
            sessions: sessions,
            tips: parsed.tips || [],
            summary: parsed.summary || '',
            pedagogy: pedagogyPack
        };
    } catch (error: any) {
        console.error('[RevisionPlanner] Error:', error);
        throw error;
    }
}

/**
 * Génère des sessions de fallback si le LLM n'a pas généré assez de sessions
 */
function generateFallbackSessions(
    eventTitle: string,
    eventDate: Date,
    targetCount: number,
    existingSessions: any[],
    durationMinutes: number
): any[] {
    const sessions = [...existingSessions];
    const sessionTypes = ['study', 'exercise', 'practice', 'exercise', 'review'];
    const sessionTitles = [
        `${eventTitle}: Vue d'ensemble et Concepts Clés`,
        `${eventTitle}: Exercices Pratiques - Niveau 1`,
        `${eventTitle}: Approfondissement et Cas Complexes`,
        `${eventTitle}: Exercices Avancés`,
        `${eventTitle}: Révision Finale et Synthèse`
    ];

    // Calculer les jours disponibles
    const today = new Date();
    const daysUntilExam = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const sessionsNeeded = targetCount - sessions.length;

    // Répartir uniformément les sessions restantes
    for (let i = 0; i < sessionsNeeded; i++) {
        const sessionIndex = sessions.length + i;
        const dayOffset = Math.floor((daysUntilExam - 1) * (sessionIndex + 1) / targetCount);

        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() + Math.max(1, dayOffset));
        sessionDate.setHours(18, 0, 0, 0); // Default to 18:00

        const endDate = new Date(sessionDate);
        endDate.setMinutes(endDate.getMinutes() + durationMinutes);

        sessions.push({
            start: sessionDate.toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00'),
            end: endDate.toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00'),
            title: sessionTitles[sessionIndex] || `${eventTitle}: Session ${sessionIndex + 1}`,
            description: `Session de révision pour ${eventTitle}. Prioriser les concepts fondamentaux.`,
            type: sessionTypes[sessionIndex] || 'study',
            exercises: []
        });
    }

    return sessions;
}

/**
 * Convertit un plan de révision en événements Google Calendar
 * Version améliorée qui utilise les dates précises (start/end) générées par l'IA
 */
export function planToCalendarEvents(plan: RevisionPlan): Array<{
    summary: string;
    description: string;
    start: { dateTime: string };
    end: { dateTime: string };
}> {
    return plan.sessions.map((session: any) => {
        // Si l'IA a fourni start/end précis, on les utilise
        if (session.start && session.end) {
            let description = `${session.description}\n\n🎯 Objectif: ${plan.eventTitle}\n📅 Échéance: ${plan.eventDate}`;

            // Ajouter les exercices à la description si présents
            if (session.exercises && session.exercises.length > 0) {
                description += `\n\n📝 EXERCICES PRATIQUES:\n`;
                session.exercises.forEach((ex: any, i: number) => {
                    const difficultyIcon = ex.difficulty === 'easy' ? '🟢' : ex.difficulty === 'medium' ? '🟡' : '🔴';
                    description += `\n${i + 1}. ${difficultyIcon} ${ex.title}\n   ${ex.instruction}`;
                    if (ex.expectedOutput) {
                        description += `\n   👉 Attendu: ${ex.expectedOutput}`;
                    }
                });
            }

            return {
                summary: `📚 ${session.title}`,
                description: description,
                start: { dateTime: session.start },
                end: { dateTime: session.end },
            };
        }

        // Fallback (ancien comportement)
        // ... (rest of fallback code)
        const durationMatch = session.duration.match(/(\d+)h?(\d*)/);
        let durationMinutes = 60;
        if (durationMatch) {
            const hours = parseInt(durationMatch[1], 10) || 0;
            const minutes = parseInt(durationMatch[2], 10) || 0;
            durationMinutes = hours * 60 + minutes;
        }

        const startDate = new Date(`${session.date}T18:00:00`); // Défaut 18h
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        return {
            summary: `📚 ${session.title}`,
            description: `${session.description}\n\n🎯 Objectif: ${plan.eventTitle}\n📅 Échéance: ${plan.eventDate}`,
            start: { dateTime: startDate.toISOString() },
            end: { dateTime: endDate.toISOString() },
        };
    });
}
