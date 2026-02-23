'use client';

import { useState, useCallback, useEffect } from 'react';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Calendar } from '@/components/calendar/Calendar';
import { ChatMessage, CalendarEvent, PendingEventResponse, PendingEvent } from '@/types';
import { RevisionPlan, RevisionSession, DetectedDeadline } from '@/types/integrations';
import { MessageSquare, Calendar as CalendarIcon } from '@/components/ui/icons';

interface MainLayoutProps {
  messages: ChatMessage[];
  events: CalendarEvent[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  onOpenArbre?: () => void;
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
  onGenerateRevision?: (config: any) => Promise<void>;
  // Revision Plan Display (inline in chat)
  revisionPlan?: RevisionPlan | null;
  onAddRevisionToCalendar?: (sessions: RevisionSession[]) => Promise<void>;
  onDismissRevisionPlan?: () => void;
  // Gmail Deadlines Display (inline in chat)
  detectedDeadlines?: DetectedDeadline[] | null;
  onAddDeadlineToCalendar?: (deadline: DetectedDeadline) => Promise<void>;
  onDismissDeadlines?: () => void;
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
  onOpenArbre,
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
  revisionPlan,
  onAddRevisionToCalendar,
  onDismissRevisionPlan,
  detectedDeadlines,
  onAddDeadlineToCalendar,
  onDismissDeadlines,
}: MainLayoutProps) {
  const [chatWidth, setChatWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'calendar'>('chat');

  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrag = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        // e.clientX is from the left edge of the screen. 
        // Our container has p-4 (16px) padding.
        const newWidth = e.clientX - 16;
        // Clamp the width between 300px and 800px (or half screen)
        setChatWidth(Math.min(Math.max(newWidth, 300), 1000));
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDragging);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    } else {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDragging);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onDrag, stopDragging]);

  return (
    <main className="w-full h-full p-0 lg:p-4 flex flex-col">
      {/* Mobile Tab Swicher Header */}
      <div className="flex lg:hidden w-full border-b border-notion-border bg-notion-bg p-2 gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveMobileTab('chat')}
          className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${activeMobileTab === 'chat' ? 'bg-notion-hover text-notion-text' : 'text-notion-textLight hover:bg-notion-hover/50'
            }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveMobileTab('calendar')}
          className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${activeMobileTab === 'calendar' ? 'bg-notion-hover text-notion-text' : 'text-notion-textLight hover:bg-notion-hover/50'
            }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Calendrier
        </button>
      </div>

      <div
        className={`flex-1 lg:grid grid-cols-1 lg:grid-cols-[var(--chat-width)_8px_1fr] h-full overflow-hidden`}
        style={{ '--chat-width': `${chatWidth}px` } as React.CSSProperties}
      >
        {/* Chat Section */}
        <div className={`h-full overflow-hidden flex flex-col p-4 lg:p-0 lg:pr-2 ${activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
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
            revisionPlan={revisionPlan}
            onAddRevisionToCalendar={onAddRevisionToCalendar}
            onDismissRevisionPlan={onDismissRevisionPlan}
            detectedDeadlines={detectedDeadlines}
            onAddDeadlineToCalendar={onAddDeadlineToCalendar}
            onDismissDeadlines={onDismissDeadlines}
          />
        </div>

        {/* Resizer Handle (Hidden on mobile) */}
        <div
          className="hidden lg:flex w-2 justify-center items-center cursor-col-resize group hover:bg-notion-hover transition-colors rounded-sm mx-[-4px] relative z-10"
          onMouseDown={startDragging}
        >
          <div className="h-8 w-1 rounded-full bg-notion-border group-hover:bg-notion-textLight transition-colors" />
        </div>

        {/* Calendar Section */}
        <div className={`h-full overflow-hidden flex flex-col p-4 lg:p-0 lg:pl-2 ${activeMobileTab === 'calendar' ? 'flex' : 'hidden lg:flex'}`}>
          <Calendar
            events={events}
            onEventClick={onEventClick}
            onDayClick={onDayClick}
            onOpenArbre={onOpenArbre}
          />
        </div>
      </div>
    </main>
  );
}
