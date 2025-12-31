import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analysis/retroactive
 * Récupère les résultats de l'analyse rétroactive (si déjà faite)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier directement en base pour éviter les erreurs d'import
    const progress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      select: { 
        retroactiveAnalysisDone: true,
        totalPoints: true,
        studiesPoints: true,
        sportPoints: true,
        proPoints: true,
        eventsCompleted: true,
      },
    });

    if (!progress?.retroactiveAnalysisDone) {
      return NextResponse.json({
        completed: false,
        message: 'Analyse rétroactive pas encore effectuée',
      });
    }

    return NextResponse.json({
      completed: true,
      results: {
        success: true,
        totalEvents: progress.eventsCompleted,
        totalPoints: progress.totalPoints,
        byCategory: {
          studies: { count: 0, points: progress.studiesPoints },
          sport: { count: 0, points: progress.sportPoints },
          pro: { count: 0, points: progress.proPoints },
          personal: { count: 0, points: 0 },
          unknown: { count: 0, points: 0 },
        },
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/analysis/retroactive:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis/retroactive
 * Lance l'analyse rétroactive du calendrier
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier directement en base si déjà fait
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      select: { 
        retroactiveAnalysisDone: true,
        totalPoints: true,
        studiesPoints: true,
        sportPoints: true,
        proPoints: true,
        eventsCompleted: true,
      },
    });

    if (existingProgress?.retroactiveAnalysisDone) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        results: {
          totalEvents: existingProgress.eventsCompleted,
          totalPoints: existingProgress.totalPoints,
          byCategory: {
            studies: { count: 0, points: existingProgress.studiesPoints },
            sport: { count: 0, points: existingProgress.sportPoints },
            pro: { count: 0, points: existingProgress.proPoints },
            personal: { count: 0, points: 0 },
          },
        },
      });
    }

    // Import dynamique pour éviter les erreurs d'initialisation
    const { RetroactiveAnalysisService } = await import('@/lib/services/retroactive-analysis');
    
    // Lance l'analyse
    const analysisService = new RetroactiveAnalysisService(session.user.id);
    const results = await analysisService.analyze();

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Erreur POST /api/analysis/retroactive:', error);
    
    // Si c'est une erreur de calendrier, on marque quand même l'analyse comme faite
    // pour éviter les boucles infinies
    if (error instanceof Error && 
        (error.message.includes('calendar') || error.message.includes('token') || error.message.includes('auth'))) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          await prisma.userProgress.upsert({
            where: { userId: session.user.id },
            create: {
              userId: session.user.id,
              retroactiveAnalysisDone: true,
              retroactiveAnalysisDate: new Date(),
            },
            update: {
              retroactiveAnalysisDone: true,
              retroactiveAnalysisDate: new Date(),
            },
          });
          console.log('[RetroactiveAnalysis] Marked as done despite error');
        }
      } catch (upsertError) {
        console.error('Failed to mark analysis as done:', upsertError);
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}


