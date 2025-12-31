import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/dev/reset-account
 * ⚠️ API de développement uniquement
 * 
 * Body optionnel: { includeRetroactiveAnalysis: boolean }
 * - false (défaut): Reset onboarding et préférences, GARDE l'analyse rétroactive
 * - true: Reset COMPLET pour simuler une vraie première connexion
 */
export async function POST(req: NextRequest) {
  // Seulement en développement
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'API disponible uniquement en développement' },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse le body pour voir si on reset aussi l'analyse rétroactive
    let includeRetroactiveAnalysis = false;
    try {
      const body = await req.json();
      includeRetroactiveAnalysis = body.includeRetroactiveAnalysis === true;
    } catch {
      // Body vide = reset partiel par défaut
    }

    await prisma.$transaction(async (tx) => {
      if (includeRetroactiveAnalysis) {
        // ⚠️ RESET COMPLET - Supprime TOUT y compris l'analyse rétroactive
        
        // 1. Supprimer UserProgress (points, streaks, analyse rétroactive)
        await tx.userProgress.deleteMany({
          where: { userId },
        });

        // 2. Supprimer l'historique XP
        const progress = await tx.userProgress.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (progress) {
          await tx.xpHistory.deleteMany({
            where: { userProgressId: progress.id },
          });
        }
      }

      // 3. Supprimer UserPreferences (toujours)
      await tx.userPreferences.deleteMany({
        where: { userId },
      });

      // 4. Supprimer les validations de tâches
      await tx.taskValidation.deleteMany({
        where: { userId },
      });

      // 5. Supprimer les quiz
      await tx.quiz.deleteMany({
        where: { userId },
      });

      // 6. Supprimer les skill progress
      await tx.userSkillProgress.deleteMany({
        where: { userId },
      });

      // 7. Supprimer les conversations
      await tx.conversation.deleteMany({
        where: { userId },
      });

      // 8. Supprimer les arbres de préparation
      await tx.preparationTree.deleteMany({
        where: { userId },
      });

      // 9. Supprimer la mémoire agent
      await tx.agentMemory.deleteMany({
        where: { userId },
      });

      // 10. Réinitialiser les flags utilisateur
      await tx.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: includeRetroactiveAnalysis 
        ? '🔄 Reset COMPLET effectué (y compris analyse rétroactive)'
        : '✅ Reset onboarding effectué (analyse rétroactive conservée)',
      reset: {
        userProgress: includeRetroactiveAnalysis,
        retroactiveAnalysis: includeRetroactiveAnalysis,
        userPreferences: true,
        taskValidations: true,
        quizzes: true,
        skillProgress: true,
        conversations: true,
        preparationTrees: true,
        agentMemory: true,
        onboardingFlags: true,
      },
    });
  } catch (error) {
    console.error('Erreur reset account:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dev/reset-account
 * Affiche l'état actuel du compte (pour debug)
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'API disponible uniquement en développement' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, progress, preferences] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          onboardingCompleted: true,
          onboardingStep: true,
        },
      }),
      prisma.userProgress.findUnique({
        where: { userId },
      }),
      prisma.userPreferences.findUnique({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      user,
      progress,
      preferences,
      hasCompletedRetroactiveAnalysis: progress?.retroactiveAnalysisDone ?? false,
    });
  } catch (error) {
    console.error('Erreur get account state:', error);
    return NextResponse.json(
      { error: 'Erreur', details: (error as Error).message },
      { status: 500 }
    );
  }
}
