import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/revoke
 * Supprime le compte OAuth de l'utilisateur pour forcer une re-autorisation
 * avec les nouveaux scopes (Drive, Gmail)
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Supprimer toutes les données liées à l'utilisateur pour permettre une nouvelle auth
        // Ordre important : d'abord les tables dépendantes, puis User
        await prisma.session.deleteMany({ where: { userId } });
        await prisma.account.deleteMany({ where: { userId } });

        // On supprime le User entièrement pour éviter le login loop
        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({
            success: true,
            message: 'Compte supprimé. Veuillez vous reconnecter comme nouvel utilisateur.',
        });

    } catch (error: any) {
        console.error('[Auth Revoke] Error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la révocation', details: error.message },
            { status: 500 }
        );
    }
}
