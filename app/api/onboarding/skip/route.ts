import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/onboarding/skip
 * Skip l'onboarding en appliquant les valeurs par défaut
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Valeurs par défaut pour un skip
    const defaultPreferences = {
      priorityActivities: ['studies'], // Par défaut, études
      studySubjects: [],
      sportDiscipline: null,
      targetSoftSkills: ['punctuality', 'perseverance', 'organization'], // Defaults
      dailyNotificationTime: '08:00',
      messageTone: 'supportive',
      sportIntegrations: [],
    };

    await prisma.$transaction(async (tx) => {
      // Créer les préférences par défaut
      await tx.userPreferences.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...defaultPreferences,
        },
        update: {
          // Ne pas écraser si des données existent déjà
        },
      });

      // Marquer l'onboarding comme complété (mais skipped)
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          onboardingCompleted: true,
          onboardingStep: -1, // -1 indique un skip
        },
      });
    });

    return NextResponse.json({ success: true, skipped: true });
  } catch (error) {
    console.error('Erreur API onboarding/skip:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


