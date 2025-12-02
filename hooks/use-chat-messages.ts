import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { sendChatMessage } from '@/lib/api/chat-api-client';

interface UseChatMessagesOptions {
  isAuthenticated: boolean;
  onCalendarRefresh: () => void;
}

/**
 * Hook pour gérer les messages du chat et l'interaction avec l'agent
 * @param options - Options de configuration (authentification, callback de refresh)
 * @returns Objet contenant les messages, fonctions d'envoi et état de chargement
 */
export function useChatMessages({ isAuthenticated, onCalendarRefresh }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false); // Protection contre les doubles envois
  const { addNotification } = useNotifications();
  const messagesRef = useRef<ChatMessage[]>([]);

  // Synchroniser messages avec ref pour éviter les problèmes de closure
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!isAuthenticated) {
      addNotification({
        title: 'Connexion requise',
        message: 'Connectez-vous avec Google pour utiliser Tempo.',
        type: 'warning',
        duration: 5000,
      });
      return;
    }

    // Protection contre les doubles envois
    if (isSending || isLoading) {
      addNotification({
        title: 'Envoi en cours',
        message: 'Veuillez patienter, votre message est en cours de traitement.',
        type: 'info',
        duration: 3000,
      });
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsSending(true);

    try {
      // Call the agent API - utiliser messagesRef pour avoir la valeur à jour
      const currentMessages = [...messagesRef.current, userMessage];
      const messagesToSend = currentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const data = await sendChatMessage(messagesToSend);

      // Refresh calendar based on action
      if (data.action === 'create') {
        addNotification({
          title: 'Événement créé',
          message: 'L\'événement a été ajouté à votre calendrier',
          type: 'success',
          duration: 5000,
        });
        onCalendarRefresh();
      } else if (data.action === 'delete') {
        addNotification({
          title: 'Événement supprimé',
          message: 'L\'événement a été retiré de votre calendrier',
          type: 'info',
          duration: 5000,
        });
        onCalendarRefresh();
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          events: data.events,
          action: data.action,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Handle reauth required
      if (error.requiresReauth) {
        addNotification({
          title: 'Session expirée',
          message: error.message || 'Veuillez vous reconnecter avec Google',
          type: 'warning',
          duration: 7000,
        });
      } else {
        // Afficher un message d'erreur détaillé avec code si disponible
        const errorMessage = error.message || 'Une erreur est survenue lors du traitement de votre demande';
        const errorTitle = error.code ? `Erreur [${error.code}]` : 'Erreur';
        
        addNotification({
          title: errorTitle,
          message: errorMessage,
          type: 'error',
          duration: 6000,
        });
      }
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  }, [addNotification, isAuthenticated, onCalendarRefresh]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    clearMessages,
  };
}

