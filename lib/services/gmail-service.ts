import { google, gmail_v1 } from 'googleapis';
import { EmailMessage, DetectedDeadline } from '@/types/integrations';

export type { EmailMessage, DetectedDeadline };

/**
 * Récupère les emails récents de l'utilisateur
 */
export async function fetchRecentEmails(
    accessToken: string,
    days: number = 2
): Promise<EmailMessage[]> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });

    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - days);
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

    try {
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: `after:${afterTimestamp}`,
            maxResults: 20,
        });

        const messages = response.data.messages || [];

        const emailDetails: EmailMessage[] = await Promise.all(
            messages.map(async (msg) => {
                const detail = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id || '',
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date'],
                });

                const headers = detail.data.payload?.headers || [];
                const getHeader = (name: string) =>
                    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

                return {
                    id: msg.id || '',
                    threadId: msg.threadId || '',
                    subject: getHeader('Subject'),
                    from: getHeader('From'),
                    date: getHeader('Date'),
                    snippet: detail.data.snippet || '',
                };
            })
        );

        return emailDetails;
    } catch (error) {
        console.error('[Gmail Service] Error fetching emails:', error);
        throw error;
    }
}

/**
 * Récupère le contenu complet d'un email
 * @param accessToken Token d'accès Google
 * @param messageId ID du message
 * @returns Contenu du message
 */
export async function getEmailContent(
    accessToken: string,
    messageId: string
): Promise<string> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const detail = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
        });

        // Extraire le corps du message
        const parts = detail.data.payload?.parts;
        if (parts) {
            const textPart = parts.find((p) => p.mimeType === 'text/plain');
            if (textPart?.body?.data) {
                return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
        }

        // Fallback: snippet
        return detail.data.snippet || '';
    } catch (error) {
        console.error('[Gmail Service] Error getting email content:', error);
        throw error;
    }
}

/**
 * Formate les emails pour l'analyse IA
 */
export function formatEmailsForAnalysis(emails: EmailMessage[]): string {
    return emails
        .map(
            (email, index) => `
Email ${index + 1}:
- Sujet: ${email.subject}
- De: ${email.from}
- Date: ${email.date}
- Aperçu: ${email.snippet}
`
        )
        .join('\n---\n');
}
