'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Calendar } from '@/components/calendar/Calendar';
import { ChatMessage, CalendarEvent, PendingEventResponse, PendingEvent } from '@/types';

interface MainLayoutProps {
  messages: ChatMessage[];
  events: CalendarEvent[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  // 🆕 Props pour la confirmation d'événements
  pendingEvent?: PendingEventResponse | null;
  isConfirming?: boolean;
  onConfirmEvent?: () => Promise<void>;
  onModifyEvent?: () => void;
  onRejectEvent?: (reason?: string) => Promise<void>;
  // MVP Props
  onSelectIntegration?: (type: any) => void;
  isIntegrationProcessing?: boolean;
  processingIntegrationType?: any;
  // Revision Flow Props
  revisionFlowState?: 'idle' | 'proposing' | 'ingesting' | 'generating';
  revisionEvent?: { title: string; date: string } | null;
  onAcceptRevision?: () => void;
  onDeclineRevision?: () => void;
  onGenerateRevision?: (docs: any[]) => Promise<void>;
}

/**
 * Composant layout principal contenant le chat et le calendrier
 */
export function MainLayout({
  messages,
  events,
  onSendMessage,
  isLoading,
  onEventClick,
  onDayClick,
  pendingEvent,
  isConfirming,
  onConfirmEvent,
  onModifyEvent,
  onRejectEvent,
  onSelectIntegration,
  isIntegrationProcessing,
  processingIntegrationType,
  revisionFlowState,
  revisionEvent,
  onAcceptRevision,
  onDeclineRevision,
  onGenerateRevision,
}: MainLayoutProps) {
  return (
    <main className="max-w-[1800px] mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
        {/* Chat Section */}
        <div style={{ minHeight: 0, height: '100%', overflow: 'hidden' }}>
          <ChatInterface
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            pendingEvent={pendingEvent}
            isConfirming={isConfirming}
            onConfirmEvent={onConfirmEvent}
            onModifyEvent={onModifyEvent}
            onRejectEvent={onRejectEvent}
            onSelectIntegration={onSelectIntegration}
            isIntegrationProcessing={isIntegrationProcessing}
            processingIntegrationType={processingIntegrationType}
            revisionFlowState={revisionFlowState}
            revisionEvent={revisionEvent}
            onAcceptRevision={onAcceptRevision}
            onDeclineRevision={onDeclineRevision}
            onGenerateRevision={onGenerateRevision}
          />
        </div>

        {/* Calendar Section */}
        <div style={{ minHeight: 0, height: '100%', overflow: 'hidden' }}>
          <Calendar
            events={events}
            onEventClick={onEventClick}
            onDayClick={onDayClick}
          />
        </div>
      </div>
    </main>
  );
}
