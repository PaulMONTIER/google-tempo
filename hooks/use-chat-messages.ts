import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, PendingEventResponse, PendingEvent } from '@/types';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { sendChatMessage } from '@/lib/api/chat-api-client';

interface UseChatMessagesOptions {
  isAuthenticated: boolean;
  onCalendarRefresh: () => void;
  requireConfirmation?: boolean; // 🆕 Option pour la confirmation
}

/**
 * Hook pour gérer les messages du chat et l'interaction avec l'agent
 * @param options - Options de configuration (authentification, callback de refresh)
 * @returns Objet contenant les messages, fonctions d'envoi, pending event et état de chargement
 */
export function useChatMessages({ isAuthenticated, onCalendarRefresh, requireConfirmation = true }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<PendingEventResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
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
    setPendingEvent(null); // Clear any previous pending event

    try {
      // Call the agent API
      const currentMessages = [...messagesRef.current, userMessage];
      const messagesToSend = currentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // 🆕 Récupérer les règles actives depuis localStorage
      const savedRules = localStorage.getItem('tempo-rules');
      const allRules = savedRules ? JSON.parse(savedRules) : [];
      const activeRules = allRules.filter((r: any) => r.enabled);

      const data = await sendChatMessage(messagesToSend, {
        requireConfirmation,
        rules: activeRules, // 🆕 Passer les règles actives
      });

      // 🆕 Gérer les pending events (confirmation humaine)
      if (data.pendingEvent) {
        setPendingEvent(data.pendingEvent);
        // Ajouter le message de l'agent concernant le pending event
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            action: 'pending',
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Comportement normal (pas de pending event)
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
      }
    } catch (error: any) {
      console.error('Chat error:', error);

      if (error.requiresReauth) {
        addNotification({
          title: 'Session expirée',
          message: error.message || 'Veuillez vous reconnecter avec Google',
          type: 'warning',
          duration: 7000,
        });
      } else {
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
  }, [addNotification, isAuthenticated, onCalendarRefresh, isSending, isLoading]);

  /**
   * Confirmer un événement en attente
   */
  const confirmEvent = useCallback(async () => {
    if (!pendingEvent) return;

    setIsConfirming(true);
    try {
      const isBatchDelete = pendingEvent.actionType === 'batch_delete';

      const response = await fetch('/api/calendar/events/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: pendingEvent.event,
          action: 'accept',
          actionType: pendingEvent.actionType || 'create',
          eventId: pendingEvent.eventId, // Pour suppression simple
          eventIds: pendingEvent.eventIds, // 🆕 Pour suppression batch
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 🆕 Adapter le message selon le type d'action
        const isDelete = pendingEvent.actionType === 'delete';
        const deleteCount = isBatchDelete ? (data.deleted || pendingEvent.count || pendingEvent.eventIds?.length || 0) : 0;

        addNotification({
          title: isBatchDelete
            ? `${deleteCount} événement(s) supprimé(s)`
            : isDelete
              ? 'Événement supprimé'
              : 'Événement créé',
          message: isBatchDelete
            ? `Les ${deleteCount} événements ont été supprimés de votre calendrier`
            : isDelete
              ? `"${pendingEvent.event.title}" a été supprimé`
              : `"${pendingEvent.event.title}" a été ajouté à votre calendrier`,
          type: 'success',
          duration: 5000,
        });

        setPendingEvent(null);
        onCalendarRefresh();
      } else {
        throw new Error(data.error || 'Erreur lors de l\'opération');
      }
    } catch (error: any) {
      addNotification({
        title: 'Erreur',
        message: error.message || 'Impossible d\'effectuer l\'opération',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsConfirming(false);
    }
  }, [pendingEvent, addNotification, onCalendarRefresh]);

  // 🆕 État pour savoir si on est en mode édition
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  /**
   * Modifier un événement en attente (ouvre le formulaire)
   */
  const modifyEvent = useCallback(() => {
    if (!pendingEvent) return;
    setIsEditingEvent(true);
  }, [pendingEvent]);

  /**
   * Fermer le modal d'édition sans sauvegarder
   */
  const cancelModify = useCallback(() => {
    setIsEditingEvent(false);
  }, []);

  /**
   * Confirmer avec les modifications
   */
  const confirmWithModification = useCallback(async (modifiedEvent: Partial<PendingEvent>) => {
    if (!pendingEvent) return;

    setIsConfirming(true);
    setIsEditingEvent(false);

    try {
      const response = await fetch('/api/calendar/events/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: pendingEvent.event,
          action: 'accept',
          actionType: 'create',
          modifiedEvent, // 🆕 Envoyer les modifications
        }),
      });

      const data = await response.json();

      if (data.success) {
        const finalTitle = modifiedEvent.title || pendingEvent.event.title;

        addNotification({
          title: 'Événement créé',
          message: `"${finalTitle}" a été ajouté à votre calendrier`,
          type: 'success',
          duration: 5000,
        });

        // Note: On n'ajoute pas de message ici pour éviter les doublons

        setPendingEvent(null);
        onCalendarRefresh();
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error: any) {
      addNotification({
        title: 'Erreur',
        message: error.message || 'Impossible de créer l\'événement',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsConfirming(false);
    }
  }, [pendingEvent, addNotification, onCalendarRefresh]);

  /**
   * Refuser un événement en attente
   */
  const rejectEvent = useCallback(async (reason?: string) => {
    if (!pendingEvent) return;

    setIsConfirming(true);
    try {
      const isDelete = pendingEvent.actionType === 'delete';
      const actionLabel = isDelete ? 'suppression' : 'création';

      const response = await fetch('/api/calendar/events/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: pendingEvent.event,
          action: 'reject',
          actionType: pendingEvent.actionType || 'create', // 🆕 Type d'action
          rejectionReason: reason,
        }),
      });

      const data = await response.json();

      // Ajouter un message de refus
      const rejectMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `❌ La ${actionLabel} a été refusée.${reason ? ` Raison : ${reason}` : ''}`,
        role: 'assistant',
        timestamp: new Date(),
        metadata: { action: 'none' },
      };
      setMessages((prev) => [...prev, rejectMessage]);

      // Si une raison est fournie, on demande une alternative
      if (reason && data.nextPrompt) {
        // Envoyer automatiquement une nouvelle demande avec la raison
        setTimeout(() => {
          sendMessage(data.nextPrompt);
        }, 500);
      }

      setPendingEvent(null);

      addNotification({
        title: isDelete ? 'Suppression annulée' : 'Création annulée',
        message: reason ? 'L\'agent va proposer une alternative.' : `La ${actionLabel} a été annulée.`,
        type: 'info',
        duration: 4000,
      });
    } catch (error: any) {
      addNotification({
        title: 'Erreur',
        message: error.message || 'Erreur lors du refus',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsConfirming(false);
    }
  }, [pendingEvent, addNotification, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingEvent(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    clearMessages,
    // 🆕 Exports pour la confirmation
    pendingEvent,
    isConfirming,
    confirmEvent,
    modifyEvent,
    rejectEvent,
    // 🆕 Exports pour l'édition
    isEditingEvent,
    cancelModify,
    confirmWithModification,
  };
}
