'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { EventDetailsPanel } from '@/components/events/EventDetailsPanel';
import { RevisionConfigurationModal } from '@/components/chat/RevisionConfigurationModal';
import { RulesPanel } from '@/components/rules/RulesPanel';
import { ArbrePanel } from '@/components/arbre/ArbrePanel';
import { ProgressionPanel } from '@/components/progression/ProgressionPanel';
import { AuthGate } from '@/components/layout/AuthGate';
import { AppHeader } from '@/components/layout/AppHeader';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventEditModal } from '@/components/chat/EventEditModal'; // Pour le chat
import { ManualEventEditModal } from '@/components/events/ManualEventEditModal'; // Pour l'édition manuelle
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { usePanelState } from '@/hooks/use-panel-state';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { useSettings } from '@/components/providers/settings-provider';
import { CalendarEvent } from '@/types';

// MVP Components
import { useIntegrations } from '@/hooks/use-integrations';
import { GmailDeadlineCard } from '@/components/chat/GmailDeadlineCard';
import { DriveFilePicker } from '@/components/chat/DriveFilePicker';
import { RevisionPlanCard } from '@/components/chat/RevisionPlanCard';
import { DetectedDeadline, RevisionSession } from '@/types/integrations';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const { settings } = useSettings();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [manualEditingEvent, setManualEditingEvent] = useState<CalendarEvent | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Check onboarding status on first load
  useEffect(() => {
    if (!isAuthenticated) {
      setIsCheckingOnboarding(false);
      return;
    }

    async function checkOnboarding() {
      try {
        const res = await fetch('/api/onboarding/status');
        const data = await res.json();

        if (!data.completed) {
          console.log('[Home] Onboarding non complété, redirection...');
          router.push('/onboarding');
          return;
        }
      } catch (error) {
        console.error('[Home] Erreur vérification onboarding:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    }

    checkOnboarding();
  }, [isAuthenticated, router]);

  // Hooks pour gérer les données et états
  const { events, refreshEvents, createEvent } = useCalendarEvents(isAuthenticated);
  const { addNotification } = useNotifications();

  // MVP Integrations Hook
  const integrations = useIntegrations();

  const {
    messages,
    sendMessage,
    isLoading,
    clearMessages,
    // Exports pour la confirmation
    pendingEvent,
    isConfirming,
    confirmEvent,
    modifyEvent,
    rejectEvent,
    // Exports pour l'édition (Chat)
    isEditingEvent,
    cancelModify,
    confirmWithModification,
  } = useChatMessages({
    isAuthenticated,
    onCalendarRefresh: refreshEvents,
    requireConfirmation: settings.requireEventConfirmation,
  });
  const panelState = usePanelState();

  // Update date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Report integration errors via toast notifications (NOT chat)
  useEffect(() => {
    if (integrations.error) {
      addNotification({
        title: 'Erreur d\'intégration',
        message: integrations.error,
        type: 'error',
        duration: 5000,
      });
      integrations.clearError();
    }
  }, [integrations.error, integrations, addNotification]);

  // Handlers pour les interactions
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    const dateStr = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    sendMessage(`Afficher les événements du ${dateStr}`);
  }, [sendMessage]);

  // Handler pour lancer l'édition manuelle depuis le panneau de détails
  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(null);
    setManualEditingEvent(event);
  }, []);

  // Handler appelé après une modification manuelle réussie
  const handleManualEditSuccess = useCallback(() => {
    refreshEvents();
    setManualEditingEvent(null);
  }, [refreshEvents]);

  // MVP Handlers
  // Revision Flow State
  const [revisionFlowState, setRevisionFlowState] = useState<'idle' | 'proposing' | 'ingesting' | 'generating'>('idle');
  const [revisionEvent, setRevisionEvent] = useState<{ title: string; date: string } | null>(null);

  const handleAddToCalendar = async (deadline: DetectedDeadline) => {
    try {
      // Créer l'événement
      await createEvent({
        title: deadline.title,
        description: `${deadline.description || ''}\n\nSource: ${deadline.sourceSubject}`,
        startDate: new Date(`${deadline.date}T09:00:00`),
        endDate: new Date(`${deadline.date}T10:00:00`),
        extendedProps: {
          suggestedResources: deadline.suggestedResources
        }
      });

      // Trigger proactive revision flow
      setRevisionEvent({ title: deadline.title, date: deadline.date });
      setRevisionFlowState('proposing');
      integrations.clearDeadlines(); // Clear the card since we're moving to the next step
    } catch (error) {
      console.error('Error adding deadline event:', error);
    }
  };

  const handleAcceptRevision = () => {
    setRevisionFlowState('ingesting');
  };

  const handleDeclineRevision = () => {
    setRevisionFlowState('idle');
    setRevisionEvent(null);
    sendMessage("Pas de problème ! N'hésite pas si tu changes d'avis.");
  };

  const handleGenerateRevision = async (config: any) => {
    if (!revisionEvent) return;

    setRevisionFlowState('generating');

    // Pass full config including sessionsCount, sessionDuration, includeQCM
    await integrations.generateRevisionPlan({
      eventTitle: revisionEvent.title,
      eventDate: revisionEvent.date,
      documents: config.documents || [],
      sessionsCount: config.sessionsCount,
      sessionDuration: config.sessionDuration,
      includeQCM: config.includeQCM,
    });

    setRevisionFlowState('idle');
    setRevisionEvent(null);
  };

  const handleAddRevisionSessions = async (sessions: RevisionSession[]) => {
    try {
      const createdEventIds: string[] = [];

      for (const session of sessions) {
        // Parse duration (ex: "1h30" or "90min")
        let durationMinutes = 60;

        if (session.duration.includes('min')) {
          durationMinutes = parseInt(session.duration.replace('min', ''), 10);
        } else {
          const durationMatch = session.duration.match(/(\d+)h?(\d*)/);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1] || '0', 10);
            const minutes = parseInt(durationMatch[2] || '0', 10);
            durationMinutes = hours * 60 + minutes;
          }
        }

        const startDate = new Date(session.start || `${session.date}T14:00:00`);
        // If we have an explicit end date from the plan, use it, otherwise calculate from duration
        const endDate = session.end
          ? new Date(session.end)
          : new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        const createdEvent = await createEvent({
          title: `📚 ${session.title}`,
          description: session.description,
          startDate: startDate,
          endDate: endDate,
        });

        if (createdEvent?.id) {
          createdEventIds.push(createdEvent.id);
        }
      }

      // Create a tree in Arbre with this revision plan
      if (integrations.revisionPlan && createdEventIds.length > 0) {
        try {
          const plan = integrations.revisionPlan;
          const treeId = `revision_${Date.now()}`;

          // Create tree via API
          const treeResponse = await fetch('/api/trees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              treeId,
              goalEventId: `goal_${treeId}`, // Virtual ID for the goal (the exam)
              goalTitle: plan.eventTitle,
              goalDate: new Date(plan.eventDate).toISOString(),
              detectionMethod: 'revision_planner',
            }),
          });

          if (treeResponse.ok) {
            // Add branches for each session using PUT /api/trees/[treeId]
            for (let i = 0; i < sessions.length; i++) {
              const session = sessions[i];
              const eventId = createdEventIds[i] || `session_${i}`;

              await fetch(`/api/trees/${treeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  branchEventId: eventId,
                  branchTitle: session.title,
                  branchDate: new Date(session.start || session.date).toISOString(),
                  order: i,
                }),
              });
            }
            console.log(`[Revision] Tree created with ${sessions.length} branches`);
          }
        } catch (treeError) {
          console.error('Error creating tree:', treeError);
          // Don't fail the whole operation if tree creation fails
        }
      }

      integrations.clearRevisionPlan();

    } catch (error) {
      console.error('Error adding revision sessions:', error);
    }
  };



  // Revision Configuration Modal State
  const [isRevisionConfigOpen, setIsRevisionConfigOpen] = useState(false);
  const [selectedRevisionEvent, setSelectedRevisionEvent] = useState<CalendarEvent | null>(null);

  const handleOpenRevisionConfig = (event: CalendarEvent) => {
    setSelectedRevisionEvent(event);
    setIsRevisionConfigOpen(true);
  };

  const handleGenerateRevisionFromConfig = async (config: any) => {
    if (!selectedRevisionEvent) return;

    setRevisionFlowState('generating');

    // Pass data directly to avoid state race conditions
    await integrations.generateRevisionPlan({
      eventTitle: selectedRevisionEvent.title,
      eventDate: new Date(selectedRevisionEvent.startDate).toISOString(), // Ensure ISO string
      documents: config.documents,
      ...config
    });

    setRevisionFlowState('idle');
    setSelectedRevisionEvent(null);
  };

  // Si non authentifié, afficher l'écran de connexion
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  // Si on vérifie encore l'onboarding, afficher un écran de chargement
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-notion-sidebar flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-text"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-notion-sidebar flex flex-col overflow-hidden">
      <AppHeader
        currentDate={currentDate}
        session={session}
        onOpenSettings={() => { panelState.setSettingsTab('account'); panelState.setIsSettingsOpen(true); }}
        onOpenRules={() => panelState.setIsRulesOpen(true)}
        onOpenConnectors={() => { panelState.setSettingsTab('connectors'); panelState.setIsSettingsOpen(true); }}
        onOpenArbre={() => panelState.setIsArbreOpen(true)}
        onOpenProgression={() => panelState.setIsProgressionOpen(true)}
        onClearChat={clearMessages}
        onOpenNotifications={() => panelState.setIsNotificationPanelOpen(true)}
        isMenuOpen={panelState.isMenuOpen}
        setIsMenuOpen={panelState.setIsMenuOpen}
        menuRef={panelState.menuRef}
      />

      <div className="w-full flex-1 overflow-hidden">
        <MainLayout
          messages={messages}
          events={events}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          pendingEvent={pendingEvent}
          isConfirming={isConfirming}
          onConfirmEvent={confirmEvent}
          onModifyEvent={modifyEvent}
          onRejectEvent={rejectEvent}
          onOpenArbre={() => panelState.setIsArbreOpen(true)}
          // MVP Props
          onSelectIntegration={integrations.handleIntegration}
          isIntegrationProcessing={integrations.isProcessing}
          processingIntegrationType={integrations.processingType}
          // Revision Flow
          revisionFlowState={revisionFlowState}
          revisionEvent={revisionEvent}
          onAcceptRevision={handleAcceptRevision}
          onDeclineRevision={handleDeclineRevision}
          onGenerateRevision={handleGenerateRevision}
          // Revision Plan - Inline in Chat
          revisionPlan={integrations.revisionPlan}
          onAddRevisionToCalendar={handleAddRevisionSessions}
          onDismissRevisionPlan={integrations.clearRevisionPlan}
          // Gmail Deadlines - Inline in Chat
          detectedDeadlines={integrations.detectedDeadlines}
          onAddDeadlineToCalendar={handleAddToCalendar}
          onDismissDeadlines={integrations.clearDeadlines}
        />
      </div>

      {/* Panels */}
      <SettingsPanel isOpen={panelState.isSettingsOpen} onClose={() => panelState.setIsSettingsOpen(false)} initialTab={panelState.settingsTab} />
      <RulesPanel isOpen={panelState.isRulesOpen} onClose={() => panelState.setIsRulesOpen(false)} />
      <ArbrePanel isOpen={panelState.isArbreOpen} onClose={() => panelState.setIsArbreOpen(false)} />
      <ProgressionPanel isOpen={panelState.isProgressionOpen} onClose={() => panelState.setIsProgressionOpen(false)} />
      <NotificationPanel isOpen={panelState.isNotificationPanelOpen} onClose={() => panelState.setIsNotificationPanelOpen(false)} />

      <EventDetailsPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        allEvents={events}
        onEdit={handleEditEvent}
        onGenerateRevision={handleOpenRevisionConfig}
      />

      {/* Revision Configuration Modal */}
      {selectedRevisionEvent && (
        <RevisionConfigurationModal
          isOpen={isRevisionConfigOpen}
          onClose={() => setIsRevisionConfigOpen(false)}
          onGenerate={handleGenerateRevisionFromConfig}
          eventTitle={selectedRevisionEvent.title}
        />
      )}

      {/* Modal d'édition manuelle */}
      {manualEditingEvent && (
        <ManualEventEditModal
          event={manualEditingEvent}
          onClose={() => setManualEditingEvent(null)}
          onSaveSuccess={handleManualEditSuccess}
        />
      )}

      {/* Modal d'édition d'événement (Chat - existant) */}
      {isEditingEvent && pendingEvent && (
        <EventEditModal
          pendingEvent={pendingEvent}
          onSave={confirmWithModification}
          onCancel={cancelModify}
          isLoading={isConfirming}
        />
      )}

      {/* MVP Modals */}
      {integrations.isPickerOpen && (
        <DriveFilePicker
          onFilesSelected={(files) => {
            integrations.handleFilesSelected(files);
            // Auto-trigger plan generation if we have a target event
            if (integrations.targetEvent) {
              integrations.generateRevisionPlan();
            } else {
              sendMessage(`J'ai sélectionné ${files.length} documents. Pour quel événement veux-tu créer un programme ?`);
            }
          }}
          onClose={integrations.closeDrivePicker}
        />
      )}
    </div>
  );
}
