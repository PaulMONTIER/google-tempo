'use client';

import { useState, useCallback } from 'react';
import { PendingEventResponse, PendingEvent } from '@/types';
import { useNotifications } from '@/components/notifications/NotificationSystem';

interface UsePendingEventOptions {
    onCalendarRefresh: () => void;
    onMessageAdd: (message: { role: 'assistant'; content: string; metadata?: Record<string, unknown> }) => void;
    onSendMessage: (message: string) => void;
}

/**
 * Hook pour gérer les événements en attente de confirmation
 * Responsabilité unique: gestion du cycle de vie des pending events
 */
export function usePendingEvent({ onCalendarRefresh, onMessageAdd, onSendMessage }: UsePendingEventOptions) {
    const [pendingEvent, setPendingEvent] = useState<PendingEventResponse | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const { addNotification } = useNotifications();

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
                    eventId: pendingEvent.eventId,
                    eventIds: pendingEvent.eventIds,
                }),
            });

            const data = await response.json();

            if (data.success) {
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Impossible d\'effectuer l\'opération';
            addNotification({
                title: 'Erreur',
                message: errorMessage,
                type: 'error',
                duration: 5000,
            });
        } finally {
            setIsConfirming(false);
        }
    }, [pendingEvent, addNotification, onCalendarRefresh]);

    const modifyEvent = useCallback(() => {
        if (!pendingEvent) return;
        setIsEditingEvent(true);
    }, [pendingEvent]);

    const cancelModify = useCallback(() => {
        setIsEditingEvent(false);
    }, []);

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
                    modifiedEvent,
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

                setPendingEvent(null);
                onCalendarRefresh();
            } else {
                throw new Error(data.error || 'Erreur lors de la création');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Impossible de créer l\'événement';
            addNotification({
                title: 'Erreur',
                message: errorMessage,
                type: 'error',
                duration: 5000,
            });
        } finally {
            setIsConfirming(false);
        }
    }, [pendingEvent, addNotification, onCalendarRefresh]);

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
                    actionType: pendingEvent.actionType || 'create',
                    rejectionReason: reason,
                }),
            });

            const data = await response.json();

            onMessageAdd({
                role: 'assistant',
                content: `❌ La ${actionLabel} a été refusée.${reason ? ` Raison : ${reason}` : ''}`,
                metadata: { action: 'none' },
            });

            if (reason && data.nextPrompt) {
                setTimeout(() => {
                    onSendMessage(data.nextPrompt);
                }, 500);
            }

            setPendingEvent(null);

            addNotification({
                title: isDelete ? 'Suppression annulée' : 'Création annulée',
                message: reason ? 'L\'agent va proposer une alternative.' : `La ${actionLabel} a été annulée.`,
                type: 'info',
                duration: 4000,
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors du refus';
            addNotification({
                title: 'Erreur',
                message: errorMessage,
                type: 'error',
                duration: 5000,
            });
        } finally {
            setIsConfirming(false);
        }
    }, [pendingEvent, addNotification, onMessageAdd, onSendMessage]);

    return {
        pendingEvent,
        setPendingEvent,
        isConfirming,
        isEditingEvent,
        confirmEvent,
        modifyEvent,
        cancelModify,
        confirmWithModification,
        rejectEvent,
    };
}
