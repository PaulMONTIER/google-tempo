import { createGeminiModel } from '@/lib/ai/model-factory';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Schéma de validation pour une question de quiz
const QuizQuestionSchema = z.object({
  question: z.string().min(10, 'La question doit faire au moins 10 caractères'),
  options: z.array(z.string()).length(4, 'Il doit y avoir exactement 4 options'),
  correctAnswer: z.number().int().min(0).max(3, 'La bonne réponse doit être entre 0 et 3'),
  explanation: z.string().min(20, "L'explication doit faire au moins 20 caractères"),
});

// Schéma de validation pour un quiz complet (10 questions)
const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(10, 'Il doit y avoir exactement 10 questions'),
});

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
}

export interface GeneratedQuiz {
  questions: GeneratedQuestion[];
}

/**
 * Récupère le contexte des questionnaires précédents pour un événement goal
 */
async function getPreviousQuizContext(
  userId: string,
  goalEventId: string
): Promise<string> {
  // Récupérer les quiz précédents de cette série
  const previousQuizzes = await prisma.quiz.findMany({
    where: {
      userId,
      series: {
        goalEventId,
      },
      completed: true,
    },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 3, // Derniers 3 quiz
  });

  if (previousQuizzes.length === 0) {
    return 'Aucun questionnaire précédent pour cet objectif.';
  }

  const contextParts = previousQuizzes.map((quiz, idx) => {
    const avgScore = quiz.score / quiz.totalQuestions;
    return `Questionnaire ${idx + 1} (Score: ${quiz.score}/10, ${Math.round(avgScore * 100)}%):
- Sujets couverts: ${quiz.eventTitle}
- Questions difficiles: ${quiz.questions.filter((q) => !q.isCorrect).length} erreurs`;
  });

  return `Questionnaires précédents pour cet objectif:\n${contextParts.join('\n\n')}`;
}

/**
 * Génère un quiz de 10 questions MCQ avec Gemini
 */
export async function generateQuiz(
  userId: string,
  eventId: string,
  eventTitle: string,
  eventDescription?: string,
  goalEventId?: string,
  documentation?: string
): Promise<GeneratedQuiz> {
  const model = createGeminiModel();

  // Récupérer le contexte des quiz précédents si goalEventId fourni
  let previousContext = '';
  if (goalEventId) {
    previousContext = await getPreviousQuizContext(userId, goalEventId);
  }

  // Construire le prompt pour Gemini
  const prompt = `Tu es un expert pédagogique. Génère un questionnaire de validation de compétences de 10 questions à choix multiples (QCM).

CONTEXTE:
- Événement: ${eventTitle}
${eventDescription ? `- Description: ${eventDescription}` : ''}
${documentation ? `- Documentation fournie:\n${documentation.substring(0, 2000)}` : ''}
${previousContext ? `- ${previousContext}` : ''}

INSTRUCTIONS:
1. Génère exactement 10 questions de difficulté progressive (faciles au début, plus difficiles à la fin)
2. Chaque question doit avoir exactement 4 options (A, B, C, D)
3. Une seule réponse est correcte par question
4. Les questions doivent tester la compréhension, pas seulement la mémorisation
5. Fournis une explication claire pour chaque bonne réponse
6. Adapte le niveau selon le contexte (si c'est une révision, pose des questions sur les concepts clés)

FORMAT DE RÉPONSE (JSON strict):
{
  "questions": [
    {
      "question": "Question complète et claire",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication détaillée de pourquoi cette réponse est correcte"
    },
    ...
  ]
}

IMPORTANT:
- correctAnswer est l'index (0-3) de la bonne réponse dans le tableau options
- Génère exactement 10 questions
- Réponds UNIQUEMENT en JSON valide, sans texte avant ou après`;

  logger.debug(`[quiz-generator] Génération de quiz pour eventId: ${eventId}, userId: ${userId}`);

  try {
    const response = await model.invoke(prompt);
    let content = response.content as string;

    // Nettoyer le contenu (enlever markdown code blocks si présents)
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parser le JSON
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      logger.error('[quiz-generator] Erreur parsing JSON:', parseError);
      logger.error('[quiz-generator] Contenu reçu:', content.substring(0, 500));
      throw new Error('Erreur lors de la génération du quiz: format JSON invalide');
    }

    // Valider avec Zod
    const validated = QuizSchema.parse(parsed);

    logger.debug(`[quiz-generator] Quiz généré avec succès: ${validated.questions.length} questions`);

    return validated as GeneratedQuiz;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.error('[quiz-generator] Erreur validation Zod:', error.errors);
      throw new Error(`Erreur de validation du quiz: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    logger.error('[quiz-generator] Erreur génération quiz:', error);
    throw error;
  }
}

