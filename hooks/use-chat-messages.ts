'use client';

import { useState, useCallback } from 'react';
import { ChatMessage, PendingEventResponse, Rule } from '@/types';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { sendChatMessage } from '@/lib/api/chat-api-client';
import { useMessageHistory } from './use-message-history';
import { usePendingEvent } from './use-pending-event';

interface UseChatMessagesOptions {
  isAuthenticated: boolean;
  onCalendarRefresh: () => void;
  requireConfirmation?: boolean;
}

/**
 * Hook principal pour gérer les messages du chat et l'interaction avec l'agent
 * Compose use-message-history et use-pending-event pour une meilleure séparation des responsabilités
 */
export function useChatMessages({ isAuthenticated, onCalendarRefresh, requireConfirmation = true }: UseChatMessagesOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { addNotification } = useNotifications();

  // Composing specialized hooks
  const messageHistory = useMessageHistory();

  // Forward declaration for sendMessage (needed by usePendingEvent)
  const sendMessageRef = useCallback((content: string) => {
    // This will be populated after sendMessage is defined
  }, []);

  const pendingEventHook = usePendingEvent({
    onCalendarRefresh,
    onMessageAdd: (msg) => {
      messageHistory.addAssistantMessage(msg.content, msg.metadata);
    },
    onSendMessage: sendMessageRef,
  });

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
    const userMessage = messageHistory.addUserMessage(content);
    setIsLoading(true);
    setIsSending(true);
    pendingEventHook.setPendingEvent(null);

    try {
      const currentMessages = [...messageHistory.messagesRef.current, userMessage];
      const messagesToSend = currentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // Get active rules from localStorage
      const savedRules = localStorage.getItem('tempo-rules');
      const allRules: Rule[] = savedRules ? JSON.parse(savedRules) : [];
      const activeRules = allRules.filter(r => r.enabled);

      const data = await sendChatMessage(messagesToSend, {
        requireConfirmation,
        rules: activeRules,
      });

      // Handle pending events (human confirmation)
      if (data.pendingEvent) {
        pendingEventHook.setPendingEvent(data.pendingEvent as PendingEventResponse);
        messageHistory.addAssistantMessage(data.message, { action: 'pending' });
      } else {
        // Normal behavior (no pending event)
        handleActionNotification(data.action);
        messageHistory.addAssistantMessage(data.message, {
          events: data.events,
          action: data.action,
        });
      }
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  }, [addNotification, isAuthenticated, isSending, isLoading, messageHistory, pendingEventHook, requireConfirmation]);

  const handleActionNotification = useCallback((action: string) => {
    if (action === 'create') {
      addNotification({
        title: 'Événement créé',
        message: 'L\'événement a été ajouté à votre calendrier',
        type: 'success',
        duration: 5000,
      });
      onCalendarRefresh();
    } else if (action === 'delete') {
      addNotification({
        title: 'Événement supprimé',
        message: 'L\'événement a été retiré de votre calendrier',
        type: 'info',
        duration: 5000,
      });
      onCalendarRefresh();
    }
  }, [addNotification, onCalendarRefresh]);

  const handleError = useCallback((error: unknown) => {
    console.error('Chat error:', error);

    const err = error as { requiresReauth?: boolean; message?: string; code?: string };

    if (err.requiresReauth) {
      addNotification({
        title: 'Session expirée',
        message: err.message || 'Veuillez vous reconnecter avec Google',
        type: 'warning',
        duration: 7000,
      });
    } else {
      const errorMessage = err.message || 'Une erreur est survenue lors du traitement de votre demande';
      const errorTitle = err.code ? `Erreur [${err.code}]` : 'Erreur';

      addNotification({
        title: errorTitle,
        message: errorMessage,
        type: 'error',
        duration: 6000,
      });
    }
  }, [addNotification]);

  const clearMessages = useCallback(() => {
    messageHistory.clearMessages();
    pendingEventHook.setPendingEvent(null);
  }, [messageHistory, pendingEventHook]);

  return {
    messages: messageHistory.messages,
    sendMessage,
    isLoading,
    clearMessages,
    // Pending event exports
    pendingEvent: pendingEventHook.pendingEvent,
    isConfirming: pendingEventHook.isConfirming,
    confirmEvent: pendingEventHook.confirmEvent,
    modifyEvent: pendingEventHook.modifyEvent,
    rejectEvent: pendingEventHook.rejectEvent,
    // Editing exports
    isEditingEvent: pendingEventHook.isEditingEvent,
    cancelModify: pendingEventHook.cancelModify,
    confirmWithModification: pendingEventHook.confirmWithModification,
  };
}
