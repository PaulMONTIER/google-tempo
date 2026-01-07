import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

interface OnboardingData {
  priorityActivities: string[];
  studySubjects: string[];
  sportDiscipline: string | null;
  targetSoftSkills: string[];
  dailyNotificationTime: string;
  messageTone: string;
  sportIntegrations: string[];
}

/**
 * POST /api/onboarding/complete
 * Sauvegarde les préférences et marque l'onboarding comme complété
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data: OnboardingData = await request.json();

    console.log('📝 Onboarding data reçu:', JSON.stringify(data, null, 2));

    // Normaliser les données avec valeurs par défaut
    const normalizedData = {
      priorityActivities: data.priorityActivities || [],
      studySubjects: data.studySubjects || [],
      sportDiscipline: data.sportDiscipline || null,
      targetSoftSkills: data.targetSoftSkills || [],
      dailyNotificationTime: data.dailyNotificationTime || '08:00',
      messageTone: data.messageTone || 'supportive',
      sportIntegrations: data.sportIntegrations || [],
    };

    // Validation basique - plus souple pour le debug
    if (!normalizedData.priorityActivities || normalizedData.priorityActivities.length === 0) {
      console.log('❌ Validation échouée: priorityActivities vide');
      return NextResponse.json(
        { error: 'Au moins une activité prioritaire est requise' },
        { status: 400 }
      );
    }

    // Validation soft skills - on accepte 0-3 pour être plus flexible
    if (normalizedData.targetSoftSkills && normalizedData.targetSoftSkills.length > 3) {
      console.log('❌ Validation échouée: trop de soft skills');
      return NextResponse.json(
        { error: 'Maximum 3 savoirs-être autorisés' },
        { status: 400 }
      );
    }

    // Transaction pour créer/mettre à jour les préférences et marquer l'onboarding comme complété
    await prisma.$transaction(async (tx) => {
      // Upsert des préférences
      await tx.userPreferences.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          priorityActivities: normalizedData.priorityActivities,
          studySubjects: normalizedData.studySubjects,
          sportDiscipline: normalizedData.sportDiscipline,
          targetSoftSkills: normalizedData.targetSoftSkills,
          dailyNotificationTime: normalizedData.dailyNotificationTime,
          messageTone: normalizedData.messageTone,
          sportIntegrations: normalizedData.sportIntegrations,
        },
        update: {
          priorityActivities: normalizedData.priorityActivities,
          studySubjects: normalizedData.studySubjects,
          sportDiscipline: normalizedData.sportDiscipline,
          targetSoftSkills: normalizedData.targetSoftSkills,
          dailyNotificationTime: normalizedData.dailyNotificationTime,
          messageTone: normalizedData.messageTone,
          sportIntegrations: normalizedData.sportIntegrations,
        },
      });

      // Marquer l'onboarding comme complété
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          onboardingCompleted: true,
          onboardingStep: 8, // Terminé
        },
      });
    });

    // Lancer l'analyse rétroactive en arrière-plan (fire-and-forget)
    // On n'attend PAS la fin pour répondre au client pour éviter que ça "mouline"
    (async () => {
      try {
        console.log('[Onboarding] Lancement de l\'analyse rétroactive (background)...');
        const { RetroactiveAnalysisService } = await import('@/lib/services/retroactive-analysis');
        const analysisService = new RetroactiveAnalysisService(session.user.id);
        await analysisService.analyze();
        console.log('[Onboarding] Analyse rétroactive terminée avec succès');
      } catch (analysisError) {
        console.error('[Onboarding] Erreur lors de l\'analyse rétroactive:', analysisError);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur API onboarding/complete:', error);
    // Log détaillé de l'erreur
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

