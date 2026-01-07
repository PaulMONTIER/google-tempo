import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

interface PromotionalPreferences {
  acceptPromotionalContent?: boolean;
  acceptPersonalizedOffers?: boolean;
}

/**
 * GET /api/preferences/promotional
 * Récupère les préférences de contenu promotionnel
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: {
        acceptPromotionalContent: true,
        acceptPersonalizedOffers: true,
      },
    });

    return NextResponse.json({
      acceptPromotionalContent: preferences?.acceptPromotionalContent ?? false,
      acceptPersonalizedOffers: preferences?.acceptPersonalizedOffers ?? false,
    });
  } catch (error) {
    console.error('Erreur API preferences/promotional GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences/promotional
 * Met à jour les préférences de contenu promotionnel
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data: PromotionalPreferences = await request.json();

    // Upsert les préférences
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        priorityActivities: ['studies'], // Valeur par défaut
        targetSoftSkills: ['punctuality', 'perseverance', 'organization'], // Valeurs par défaut
        acceptPromotionalContent: data.acceptPromotionalContent ?? false,
        acceptPersonalizedOffers: data.acceptPersonalizedOffers ?? false,
      },
      update: {
        ...(data.acceptPromotionalContent !== undefined && { 
          acceptPromotionalContent: data.acceptPromotionalContent 
        }),
        ...(data.acceptPersonalizedOffers !== undefined && { 
          acceptPersonalizedOffers: data.acceptPersonalizedOffers 
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API preferences/promotional POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


