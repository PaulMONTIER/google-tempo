'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Calendar } from '@/components/calendar/Calendar';
import { ChatMessage, CalendarEvent } from '@/types';

interface MainLayoutProps {
  messages: ChatMessage[];
  events: CalendarEvent[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
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
}: MainLayoutProps) {
  return (
    <main className="max-w-[1800px] mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{height: 'calc(100vh - 180px)', overflow: 'hidden'}}>
        {/* Chat Section */}
        <div style={{minHeight: 0, height: '100%', overflow: 'hidden'}}>
          <ChatInterface
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Calendar Section */}
        <div style={{minHeight: 0, height: '100%', overflow: 'hidden'}}>
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

