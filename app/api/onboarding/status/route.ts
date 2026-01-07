import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/onboarding/status
 * Retourne l'état d'avancement de l'onboarding de l'utilisateur
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 🛡️ Requête robuste avec gestion des champs potentiellement manquants
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        preferences: true,
        userProgress: {
          select: {
            retroactiveAnalysisDone: true,
          }
        }
      },
    });

    // Si user n'existe pas, on retourne des valeurs par défaut (première connexion)
    if (!user) {
      console.log('[OnboardingStatus] Nouvel utilisateur détecté');
      return NextResponse.json({
        completed: false,
        step: 0,
        data: null,
        retroactiveAnalysisDone: false,
      });
    }

    return NextResponse.json({
      completed: user.onboardingCompleted ?? false,
      step: user.onboardingStep ?? 0,
      retroactiveAnalysisDone: user.userProgress?.retroactiveAnalysisDone ?? false,
      data: user.preferences ? {
        priorityActivities: user.preferences.priorityActivities ?? [],
        studySubjects: user.preferences.studySubjects ?? [],
        sportDiscipline: user.preferences.sportDiscipline ?? null,
        targetSoftSkills: user.preferences.targetSoftSkills ?? [],
        dailyNotificationTime: user.preferences.dailyNotificationTime ?? '08:00',
        messageTone: user.preferences.messageTone ?? 'supportive',
        sportIntegrations: user.preferences.sportIntegrations ?? [],
      } : null,
    });
  } catch (error) {
    console.error('❌ Erreur API onboarding/status:', error);
    
    // 🛡️ Retourner des valeurs par défaut en cas d'erreur plutôt qu'un 500
    // Cela permet à l'application de continuer à fonctionner
    return NextResponse.json({
      completed: false,
      step: 0,
      data: null,
      retroactiveAnalysisDone: false,
      _error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

