import { google, drive_v3 } from 'googleapis';
import { DriveFile, DriveFileContent } from '@/types/integrations';

export type { DriveFile, DriveFileContent };

/**
 * Liste les fichiers récents de l'utilisateur
 */
export async function listFiles(
    accessToken: string,
    query?: string,
    maxResults: number = 20
): Promise<DriveFile[]> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth });

    try {
        const response = await drive.files.list({
            q: query || "trashed = false",
            pageSize: maxResults,
            fields: 'files(id, name, mimeType, webViewLink, iconLink, modifiedTime, size)',
            orderBy: 'modifiedTime desc',
        });

        return (response.data.files || []) as DriveFile[];
    } catch (error) {
        console.error('[GDrive Service] Error listing files:', error);
        throw error;
    }
}

/**
 * Recherche des fichiers par nom ou contenu
 */
export async function searchFiles(
    accessToken: string,
    searchTerm: string
): Promise<DriveFile[]> {
    const query = `name contains '${searchTerm}' and trashed = false`;
    return listFiles(accessToken, query);
}

/**
 * Récupère le contenu d'un fichier Google Docs/Sheets en texte brut
 */
export async function getFileContent(
    accessToken: string,
    fileId: string
): Promise<DriveFileContent> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth });

    try {
        const metadata = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType',
        });

        const mimeType = metadata.data.mimeType || '';
        let content = '';

        if (mimeType.includes('document')) {
            const exported = await drive.files.export({
                fileId,
                mimeType: 'text/plain',
            });
            content = exported.data as string;
        } else if (mimeType.includes('spreadsheet')) {
            const exported = await drive.files.export({
                fileId,
                mimeType: 'text/csv',
            });
            content = exported.data as string;
        } else if (mimeType.includes('presentation')) {
            const exported = await drive.files.export({
                fileId,
                mimeType: 'text/plain',
            });
            content = exported.data as string;
        } else if (mimeType === 'application/pdf' || mimeType.includes('text/')) {
            const downloaded = await drive.files.get({
                fileId,
                alt: 'media',
            });
            content = typeof downloaded.data === 'string'
                ? downloaded.data
                : '[Contenu binaire non supporté]';
        } else {
            content = '[Type de fichier non supporté pour l\'extraction de texte]';
        }

        return {
            id: fileId,
            name: metadata.data.name || 'Sans nom',
            mimeType,
            content,
        };
    } catch (error) {
        console.error('[GDrive Service] Error getting file content:', error);
        throw error;
    }
}

/**
 * Récupère le contenu de plusieurs fichiers
 */
export async function getMultipleFilesContent(
    accessToken: string,
    fileIds: string[]
): Promise<DriveFileContent[]> {
    return Promise.all(
        fileIds.map((id) => getFileContent(accessToken, id))
    );
}
