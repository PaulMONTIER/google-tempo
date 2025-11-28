'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Calendar } from '@/components/calendar/Calendar';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { EventDetailsPanel } from '@/components/events/EventDetailsPanel';
import { ChatMessage, CalendarEvent } from '@/types';
import { Bell, Settings, Menu, Trash, HelpCircle, Zap, GitBranch } from '@/components/icons';
import { RulesPanel } from '@/components/rules/RulesPanel';
import { ArbrePanel } from '@/components/arbre/ArbrePanel';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isArbreOpen, setIsArbreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotifications();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Update date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load calendar events when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendarEvents();
    }
  }, [isAuthenticated]);

  const fetchCalendarEvents = async () => {
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      } else {
        console.error('Failed to fetch calendar events:', res.status);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!isAuthenticated) {
      addNotification({
        title: 'Connexion requise',
        message: 'Connectez-vous avec Google pour utiliser Tempo.',
        type: 'warning',
        duration: 5000,
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

    try {
      // Call the agent API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle reauth required
        if (errorData.requiresReauth) {
          addNotification({
            title: 'Session expirée',
            message: errorData.error || 'Veuillez vous reconnecter',
            type: 'warning',
            duration: 7000,
          });
          throw new Error(errorData.error);
        }
        
        throw new Error(errorData.error || 'Erreur API');
      }

      const data = await response.json();

      // Refresh calendar based on action
      if (data.action === 'create') {
        addNotification({
          title: 'Événement créé',
          message: 'L\'événement a été ajouté à votre calendrier',
          type: 'success',
          duration: 5000,
        });
        // Refresh calendar immediately
        fetchCalendarEvents();
      } else if (data.action === 'delete') {
        addNotification({
          title: 'Événement supprimé',
          message: 'L\'événement a été retiré de votre calendrier',
          type: 'info',
          duration: 5000,
        });
        // Refresh calendar immediately
        fetchCalendarEvents();
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
      addNotification({
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors du traitement de votre demande',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, addNotification, isAuthenticated]);

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

    handleSendMessage(`Afficher les événements du ${dateStr}`);
  }, [handleSendMessage]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-notion-sidebar px-6 text-center">
        <div className="max-w-xl bg-notion-bg border border-notion-border rounded-2xl p-10 shadow-lg space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-notion-textLight mb-3">Tempo</p>
            <h1 className="text-3xl font-semibold text-notion-text mb-2">Connectez votre compte Google</h1>
            <p className="text-notion-textLight">
              Pour que Tempo puisse analyser votre agenda et créer des événements, connectez-vous avec votre compte Google.
            </p>
          </div>
          <button
            onClick={() => signIn('google')}
            className="w-full py-3 rounded-xl bg-notion-blue text-white font-medium hover:opacity-90 transition-all"
          >
            Se connecter avec Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-sidebar">
      {/* Header */}
      <header className="bg-notion-bg border-b border-notion-border shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Logo et Branding */}
            <div className="flex items-center gap-6">
              {/* Menu hamburger */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 hover:bg-notion-sidebar rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-notion-textLight" />
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-notion-bg border border-notion-border rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
                      >
                        <Settings className="w-4 h-4 text-notion-textLight" />
                        Réglages
                      </button>
                      <button
                        onClick={() => {
                          setIsRulesOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
                      >
                        <Zap className="w-4 h-4 text-notion-textLight" />
                        Règles
                      </button>
                      <button
                        onClick={() => {
                          setIsArbreOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
                      >
                        <GitBranch className="w-4 h-4 text-notion-textLight" />
                        Arbre
                      </button>
                      <button
                        onClick={() => {
                          setMessages([]);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
                      >
                        <Trash className="w-4 h-4 text-notion-textLight" />
                        Effacer la conversation
                      </button>
                      <div className="border-t border-notion-border my-1"></div>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-notion-text hover:bg-notion-hover transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-notion-textLight" />
                        Aide
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-bold text-notion-text tracking-tight">Tempo</h1>

              {/* Date actuelle - Simple */}
              <div className="hidden md:block text-sm text-notion-textLight border-l border-notion-border pl-6">
                {currentDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Menu utilisateur et actions */}
            <div className="flex items-center gap-3">
              <button
                className="p-2.5 hover:bg-notion-sidebar rounded-lg transition-colors relative"
                onClick={() => setIsNotificationPanelOpen(true)}
              >
                <Bell className="w-5 h-5 text-notion-textLight" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-notion-red rounded-full"></span>
              </button>
              <div className="h-8 w-px bg-notion-border"></div>
              <div className="flex items-center gap-3 px-3 py-2 bg-notion-sidebar rounded-lg transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-notion-orange to-notion-yellow rounded-full flex items-center justify-center font-semibold text-white text-sm uppercase">
                  {session?.user?.name?.slice(0, 2) ?? 'TM'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-notion-text">{session?.user?.name ?? 'Utilisateur Tempo'}</p>
                  <p className="text-xs text-notion-textLight">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-notion-textLight underline hover:text-notion-text"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{height: 'calc(100vh - 180px)', overflow: 'hidden'}}>
          {/* Chat Section */}
          <div style={{minHeight: 0, height: '100%', overflow: 'hidden'}}>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>

          {/* Calendar Section */}
          <div style={{minHeight: 0, height: '100%', overflow: 'hidden'}}>
            <Calendar
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Rules Panel */}
      <RulesPanel isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Arbre Panel */}
      <ArbrePanel isOpen={isArbreOpen} onClose={() => setIsArbreOpen(false)} events={events} />

      {/* Notification Panel */}
      <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} />

      {/* Event Details Panel */}
      <EventDetailsPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} allEvents={events} />
    </div>
  );
}
