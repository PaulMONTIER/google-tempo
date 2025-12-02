import { ChatMessage } from '@/types';

export interface ChatApiResponse {
  message: string;
  events: any[];
  action: 'create' | 'delete' | 'search' | 'none';
  metadata?: {
    responseTime?: number;
    toolCalls?: number;
  };
}

export interface ChatApiError {
  error: string;
  code?: string;
  details?: unknown;
  requiresReauth?: boolean;
}

/**
 * Envoie un message au chat API et retourne la réponse
 * @param messages Liste des messages à envoyer
 * @returns Réponse de l'API avec message, events, action
 * @throws Erreur si l'appel API échoue ou si reauth est requis
 */
export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ChatApiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      // Si la réponse n'est pas du JSON, créer un payload par défaut
      payload = { error: `Erreur API (${response.status})` };
    }

    const msg = payload?.error ?? `Erreur API (${response.status})`;
    const code = payload?.code;
    const details = payload?.details;

    // Handle reauth required
    if (payload?.requiresReauth || response.status === 401) {
      const error = new Error(msg);
      (error as any).requiresReauth = true;
      (error as any).code = code;
      (error as any).details = details;
      throw error;
    }

    // Créer une erreur avec code et détails si disponibles
    const error = new Error(code ? `${msg} [${code}]` : msg);
    (error as any).code = code;
    (error as any).details = details;
    (error as any).status = response.status;
    throw error;
  }

  const data: ChatApiResponse = await response.json();
  return data;
}

