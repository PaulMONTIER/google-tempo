'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { EventDetailsPanel } from '@/components/events/EventDetailsPanel';
import { RulesPanel } from '@/components/rules/RulesPanel';
import { ArbrePanel } from '@/components/arbre/ArbrePanel';
import { ProgressionPanel } from '@/components/progression/ProgressionPanel';
import { AuthGate } from '@/components/layout/AuthGate';
import { AppHeader } from '@/components/layout/AppHeader';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventEditModal } from '@/components/chat/EventEditModal';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { usePanelState } from '@/hooks/use-panel-state';
import { useSettings } from '@/components/providers/settings-provider';
import { CalendarEvent } from '@/types';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const { settings } = useSettings();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Hooks pour gérer les données et états
  const { events, refreshEvents } = useCalendarEvents(isAuthenticated);
  const {
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

  // Si non authentifié, afficher l'écran de connexion
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen bg-notion-sidebar">
      <AppHeader
        currentDate={currentDate}
        session={session}
        onOpenSettings={() => panelState.setIsSettingsOpen(true)}
        onOpenRules={() => panelState.setIsRulesOpen(true)}
        onOpenArbre={() => panelState.setIsArbreOpen(true)}
        onOpenProgression={() => panelState.setIsProgressionOpen(true)}
        onClearChat={clearMessages}
        onOpenNotifications={() => panelState.setIsNotificationPanelOpen(true)}
        isMenuOpen={panelState.isMenuOpen}
        setIsMenuOpen={panelState.setIsMenuOpen}
        menuRef={panelState.menuRef}
      />

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
      />

      {/* Panels */}
      <SettingsPanel isOpen={panelState.isSettingsOpen} onClose={() => panelState.setIsSettingsOpen(false)} />
      <RulesPanel isOpen={panelState.isRulesOpen} onClose={() => panelState.setIsRulesOpen(false)} />
      <ArbrePanel isOpen={panelState.isArbreOpen} onClose={() => panelState.setIsArbreOpen(false)} />
      <ProgressionPanel isOpen={panelState.isProgressionOpen} onClose={() => panelState.setIsProgressionOpen(false)} />
      <NotificationPanel isOpen={panelState.isNotificationPanelOpen} onClose={() => panelState.setIsNotificationPanelOpen(false)} />
      <EventDetailsPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} allEvents={events} />

      {/* 🆕 Modal d'édition d'événement */}
      {isEditingEvent && pendingEvent && (
        <EventEditModal
          pendingEvent={pendingEvent}
          onSave={confirmWithModification}
          onCancel={cancelModify}
          isLoading={isConfirming}
        />
      )}
    </div>
  );
}
