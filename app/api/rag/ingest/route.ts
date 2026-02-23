import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { ingestDocuments } from '@/lib/rag/ingestion';

/**
 * POST /api/rag/ingest
 * Ingests files into the personal knowledge graph (Vector Store)
 * Body: { files: DriveFileContent[] }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { files } = body;

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json(
                { error: 'Aucun fichier fourni pour l\'ingestion.' },
                { status: 400 }
            );
        }

        const result = await ingestDocuments(files, session.user.id);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[RAG Ingest] Error:', error);

        return NextResponse.json(
            { error: 'Erreur lors de l\'ingestion des documents.', details: error.message },
            { status: 500 }
        );
    }
}
