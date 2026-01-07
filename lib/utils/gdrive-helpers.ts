/**
 * Formatte les fichiers pour l'affichage
 */
export function getFileIcon(mimeType: string): string {
    if (mimeType.includes('document')) return '📄';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('folder')) return '📁';
    return '📄';
}

/**
 * Formate la taille d'un fichier
 */
export function formatFileSize(bytes: string | undefined): string {
    if (!bytes) return '';
    const size = parseInt(bytes, 10);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
