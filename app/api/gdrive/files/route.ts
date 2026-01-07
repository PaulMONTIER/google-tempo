import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { listFiles, searchFiles, getFileContent } from '@/lib/services/gdrive-service';

/**
 * GET /api/gdrive/files
 * Liste les fichiers de l'utilisateur
 * Query params: search (optional), limit (optional)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json(
                { error: 'Non authentifié ou token manquant' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        let files;
        if (search) {
            files = await searchFiles(session.accessToken, search);
        } else {
            files = await listFiles(session.accessToken, undefined, limit);
        }

        return NextResponse.json({
            success: true,
            files,
            count: files.length,
        });

    } catch (error: any) {
        console.error('[GDrive Files] Error:', error);

        if (error.code === 403 || error.message?.includes('insufficientPermissions')) {
            return NextResponse.json(
                {
                    error: 'Accès Drive non autorisé. Veuillez vous reconnecter.',
                    needsReauth: true
                },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors de la récupération des fichiers', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/gdrive/files
 * Récupère le contenu d'un ou plusieurs fichiers
 * Body: { fileIds: string[] }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json(
                { error: 'Non authentifié ou token manquant' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { fileIds } = body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return NextResponse.json(
                { error: 'fileIds requis (array de string)' },
                { status: 400 }
            );
        }

        // Limiter à 5 fichiers max pour éviter les abus
        const limitedIds = fileIds.slice(0, 5);

        const contents = await Promise.all(
            limitedIds.map((id) => getFileContent(session.accessToken!, id))
        );

        return NextResponse.json({
            success: true,
            files: contents,
            count: contents.length,
        });

    } catch (error: any) {
        console.error('[GDrive Files Content] Error:', error);

        return NextResponse.json(
            { error: 'Erreur lors de la récupération du contenu', details: error.message },
            { status: 500 }
        );
    }
}
