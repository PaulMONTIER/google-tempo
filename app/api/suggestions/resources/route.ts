import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { 
  generateResourceSuggestion, 
  formatResourcesAsText,
  getResourcesForSubject,
  getResourcesForSport
} from '@/lib/services/resource-suggestion';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventTitle, subject, sport, format = 'json' } = body;

    if (!eventTitle && !subject && !sport) {
      return NextResponse.json(
        { error: 'Au moins un paramètre (eventTitle, subject, sport) est requis' },
        { status: 400 }
      );
    }

    // Générer les suggestions
    const { resources, message } = generateResourceSuggestion(
      eventTitle || '',
      subject,
      sport
    );

    // Retourner selon le format demandé
    if (format === 'text') {
      const text = formatResourcesAsText(resources);
      return NextResponse.json({
        success: true,
        message,
        text,
        count: resources.length,
      });
    }

    return NextResponse.json({
      success: true,
      message,
      resources,
      count: resources.length,
    });

  } catch (error) {
    console.error('[API] Erreur suggestions/resources:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const sport = searchParams.get('sport');

    if (!subject && !sport) {
      return NextResponse.json(
        { error: 'Paramètre subject ou sport requis' },
        { status: 400 }
      );
    }

    const resources = subject 
      ? getResourcesForSubject(subject)
      : getResourcesForSport(sport!);

    return NextResponse.json({
      success: true,
      resources,
      count: resources.length,
    });

  } catch (error) {
    console.error('[API] Erreur GET suggestions/resources:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

