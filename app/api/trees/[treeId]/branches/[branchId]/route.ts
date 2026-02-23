import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';
import { validateSession } from '@/lib/api/validators/session-validator';
import { treeService } from '@/lib/services/tree-service';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
    params: Promise<{ treeId: string; branchId: string }>;
}

/**
 * DELETE /api/trees/[treeId]/branches/[branchId] - Supprime une branche
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);

        if (validation.error) {
            return validation.error;
        }

        const { branchId } = await params;
        await treeService.deleteBranch(branchId);

        logger.info(`[API /trees/[treeId]/branches/[branchId]] Branch deleted: ${branchId}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('[API /trees/[treeId]/branches/[branchId]] DELETE error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/trees/[treeId]/branches/[branchId] - Met à jour une branche
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getAppSession();
        const validation = validateSession(session);
        if (validation.error) return validation.error;

        const { branchId } = await params;
        const body = await req.json();
        const { branchTitle, branchDate } = body;

        const updateData: any = {};
        if (branchTitle) updateData.branchTitle = branchTitle;
        if (branchDate) updateData.branchDate = new Date(branchDate);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: 'Aucune donnée à mettre à jour' },
                { status: 400 }
            );
        }

        await treeService.updateBranch(branchId, updateData);

        logger.info(`[API /trees/[treeId]/branches/[branchId]] Branch updated: ${branchId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('[API /trees/[treeId]/branches/[branchId]] PATCH error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
