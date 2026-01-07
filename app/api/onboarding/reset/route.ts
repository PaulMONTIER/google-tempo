import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/onboarding/reset
 * Reset l'état d'onboarding pour permettre à l'utilisateur de le refaire
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Reset l'onboarding de l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API onboarding/reset:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


