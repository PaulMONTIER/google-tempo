import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { treeService } from '@/lib/services/tree-service';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/trees - Récupère tous les arbres de l'utilisateur
 */
export async function GET() {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);

        if (validation.error) {
            return validation.error;
        }

        const allTrees = await treeService.getTreesByUserId(validation.userId);

        // Ne retourner que les arbres qui ont au moins 1 branche (révision)
        // Un exam seul sans révisions n'est pas considéré comme un "arbre de préparation"
        const trees = allTrees.filter(tree => tree.branches.length > 0);

        return NextResponse.json({ success: true, trees });
    } catch (error: any) {
        logger.error('[API /trees] GET error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/trees - Crée un nouvel arbre
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);

        if (validation.error) {
            return validation.error;
        }

        const body = await req.json();
        const { treeId, goalEventId, goalTitle, goalDate, detectionMethod } = body;

        if (!treeId || !goalEventId || !goalTitle || !goalDate) {
            return NextResponse.json(
                { success: false, error: 'Champs requis manquants' },
                { status: 400 }
            );
        }

        const tree = await treeService.createTree({
            userId: validation.userId,
            treeId,
            goalEventId,
            goalTitle,
            goalDate: new Date(goalDate),
            detectionMethod,
        });

        logger.info(`[API /trees] Tree created: ${tree.goalTitle}`);

        return NextResponse.json({ success: true, tree }, { status: 201 });
    } catch (error: any) {
        logger.error('[API /trees] POST error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
