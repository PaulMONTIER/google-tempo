import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { treeService } from '@/lib/services/tree-service';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
    params: Promise<{ treeId: string }>;
}

/**
 * GET /api/trees/[treeId] - Récupère un arbre spécifique
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);

        if (validation.error) {
            return validation.error;
        }

        const { treeId } = await params;
        const tree = await treeService.getTreeById(treeId);

        if (!tree) {
            return NextResponse.json(
                { success: false, error: 'Arbre non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, tree });
    } catch (error: any) {
        logger.error('[API /trees/[treeId]] GET error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/trees/[treeId] - Ajoute une branche à l'arbre
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);

        if (validation.error) {
            return validation.error;
        }

        const { treeId } = await params;
        const body = await req.json();
        const { branchEventId, branchTitle, branchDate, order } = body;

        if (!branchEventId || !branchTitle || !branchDate) {
            return NextResponse.json(
                { success: false, error: 'Champs requis manquants' },
                { status: 400 }
            );
        }

        const branch = await treeService.addBranch({
            treeId,
            branchEventId,
            branchTitle,
            branchDate: new Date(branchDate),
            order: order || 0,
        });

        logger.info(`[API /trees/[treeId]] Branch added: ${branchTitle}`);

        return NextResponse.json({ success: true, branch });
    } catch (error: any) {
        logger.error('[API /trees/[treeId]] PUT error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/trees/[treeId] - Supprime un arbre
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);

        if (validation.error) {
            return validation.error;
        }

        const { treeId } = await params;
        await treeService.deleteTree(treeId);

        logger.info(`[API /trees/[treeId]] Tree deleted: ${treeId}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('[API /trees/[treeId]] DELETE error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/trees/[treeId] - Met à jour l'arbre (titre)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);
        if (validation.error) return validation.error;

        const { treeId } = await params;
        const body = await req.json();
        const { goalTitle, goalDate } = body;

        const updateData: any = {};
        if (goalTitle) updateData.goalTitle = goalTitle;
        if (goalDate) updateData.goalDate = new Date(goalDate);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: 'Aucune donnée à mettre à jour' },
                { status: 400 }
            );
        }

        await treeService.updateTree(treeId, updateData);

        logger.info(`[API /trees/[treeId]] Tree updated: ${treeId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('[API /trees/[treeId]] PATCH error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
