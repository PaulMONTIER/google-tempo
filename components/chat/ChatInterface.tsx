'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, PendingEventResponse } from '@/types';
import { Send, Loader2 } from '@/components/ui/icons';
import { EventConfirmationCard } from './EventConfirmationCard';
import { VoiceButton } from './VoiceButton';
import { VoiceIndicator } from './VoiceIndicator';
import { IntegrationMenu, IntegrationType } from './IntegrationMenu';
import { RevisionProposalCard } from './RevisionProposalCard';
import { RevisionPlanCard } from './RevisionPlanCard';
import { GmailDeadlineCard } from './GmailDeadlineCard';
import { RevisionConfigurationModal, RevisionConfiguration } from './RevisionConfigurationModal';
import { ProactiveDemoCard } from './ProactiveDemoCard';
import { useVoiceAssistant } from '@/hooks/use-voice-assistant';
import { useSettings } from '@/components/providers/settings-provider';
import { RevisionPlan, RevisionSession, DetectedDeadline } from '@/types/integrations';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<string | void>;
  isLoading?: boolean;
  pendingEvent?: PendingEventResponse | null;
  isConfirming?: boolean;
  onConfirmEvent?: () => Promise<void>;
  onModifyEvent?: () => void;
  onRejectEvent?: (reason?: string) => Promise<void>;
  // Nouvelles props pour les intégrations
  onSelectIntegration?: (type: IntegrationType) => void;
  isIntegrationProcessing?: boolean;
  processingIntegrationType?: IntegrationType | null;
  // Revision Flow Props
  revisionFlowState?: 'idle' | 'proposing' | 'ingesting' | 'generating';
  revisionEvent?: { title: string; date: string } | null;
  onAcceptRevision?: () => void;
  onDeclineRevision?: () => void;
  onGenerateRevision?: (config: RevisionConfiguration) => Promise<void>;
  // Revision Plan Display (inline in chat)
  revisionPlan?: RevisionPlan | null;
  onAddRevisionToCalendar?: (sessions: RevisionSession[]) => Promise<void>;
  onDismissRevisionPlan?: () => void;
  // Gmail Deadlines Display (inline in chat)
  detectedDeadlines?: DetectedDeadline[] | null;
  onAddDeadlineToCalendar?: (deadline: DetectedDeadline) => Promise<void>;
  onDismissDeadlines?: () => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  pendingEvent,
  isConfirming = false,
  onConfirmEvent,
  onModifyEvent,
  onRejectEvent,
  onSelectIntegration,
  isIntegrationProcessing = false,
  processingIntegrationType = null,
  revisionFlowState = 'idle',
  revisionEvent = null,
  onAcceptRevision,
  onDeclineRevision,
  onGenerateRevision,
  revisionPlan,
  onAddRevisionToCalendar,
  onDismissRevisionPlan,
  detectedDeadlines,
  onAddDeadlineToCalendar,
  onDismissDeadlines,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingVoiceRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const { settings } = useSettings();

  // Hook pour l'assistant vocal (Web Speech API)
  const voiceSession = useVoiceAssistant({
    autoStop: settings.voiceAutoStop, // Option: couper le micro après chaque phrase
    onTranscript: async (text: string) => {
      console.log('[ChatInterface] Voice transcript received:', text);
      pendingVoiceRef.current = true;
      try {
        await onSendMessage(`🎤 ${text}`);
      } catch (error) {
        console.error('[ChatInterface] Error sending voice message:', error);
        voiceSession.speak('Désolé, une erreur s\'est produite.');
      }
    },
    onError: (error) => {
      console.error('[Voice] Error:', error);
    }
  });

  // Quand un nouveau message assistant arrive et qu'on attend une réponse vocale
  useEffect(() => {
    if (pendingVoiceRef.current && messages.length > lastMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        console.log('[ChatInterface] Speaking response:', lastMessage.content.substring(0, 50));
        voiceSession.speak(lastMessage.content);
        pendingVoiceRef.current = false;
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, voiceSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  const handleVoiceToggle = () => {
    if (voiceSession.isActive) {
      voiceSession.stopSession();
    } else {
      voiceSession.startSession();
    }
  };

  const isVoiceProcessing = voiceSession.isProcessing || (pendingVoiceRef.current && isLoading);

  return (
    <div className="flex flex-col bg-notion-bg rounded-lg shadow-sm border border-notion-border" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="p-3 lg:px-6 lg:py-4 border-b border-notion-border" style={{ flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-notion-text">Tempo</h2>
            <p className="text-xs text-notion-textLight">
              Assistant calendrier
            </p>
          </div>

          <VoiceIndicator
            isActive={voiceSession.isActive}
            isListening={voiceSession.isListening}
            isSpeaking={voiceSession.isSpeaking}
          />
        </div>

        {voiceSession.isActive && (voiceSession.transcript || isVoiceProcessing) && (
          <div className="mt-2 p-2 bg-notion-sidebar rounded text-sm text-notion-text">
            {isVoiceProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement en cours...
              </span>
            ) : (
              <span className="italic">&quot;{voiceSession.transcript}&quot;</span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="p-3 lg:px-6 lg:py-4 space-y-4" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-start h-full pb-8">
            <ProactiveDemoCard />
            <div className="text-center text-notion-textLight mt-8">
              <p className="text-sm">Pose-moi une question ou demande-moi de t'ajouter un événement.</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                ? 'bg-notion-blue text-white'
                : 'bg-notion-sidebar text-notion-text'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-notion-textLight'
                }`}>
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {pendingEvent && onConfirmEvent && onModifyEvent && onRejectEvent && (
          <EventConfirmationCard
            pendingEvent={pendingEvent}
            onAccept={onConfirmEvent}
            onModify={onModifyEvent}
            onReject={onRejectEvent}
            isLoading={isConfirming}
          />
        )}

        {/* Proactive Revision Flow */}
        {revisionFlowState === 'proposing' && revisionEvent && onAcceptRevision && onDeclineRevision && (
          <RevisionProposalCard
            eventTitle={revisionEvent.title}
            eventDate={revisionEvent.date}
            onAccept={onAcceptRevision}
            onDecline={onDeclineRevision}
          />
        )}

        {revisionFlowState === 'ingesting' && revisionEvent && onGenerateRevision && (
          <RevisionConfigurationModal
            isOpen={true}
            onClose={onDeclineRevision!}
            onGenerate={onGenerateRevision}
            eventTitle={revisionEvent.title}
          />
        )}

        {/* Revision Plan Inline Display */}
        {revisionPlan && onAddRevisionToCalendar && (
          <div className="w-full">
            <RevisionPlanCard
              plan={revisionPlan}
              onAddToCalendar={onAddRevisionToCalendar}
              onDismiss={onDismissRevisionPlan}
            />
          </div>
        )}

        {/* Gmail Deadlines Inline Display */}
        {detectedDeadlines && detectedDeadlines.length > 0 && onAddDeadlineToCalendar && (
          <div className="w-full">
            <GmailDeadlineCard
              deadlines={detectedDeadlines}
              onAddToCalendar={onAddDeadlineToCalendar}
              onDismiss={onDismissDeadlines}
            />
          </div>
        )}

        {isLoading && !voiceSession.isActive && (
          <div className="flex justify-start">
            <div className="bg-notion-sidebar text-notion-text rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 lg:px-6 lg:py-4 border-t border-notion-border" style={{ flexShrink: 0 }}>
        <div className="flex gap-2 lg:gap-3 items-center">
          {/* Bouton + Intégrations */}
          {onSelectIntegration && (
            <IntegrationMenu
              onSelectIntegration={onSelectIntegration}
              isProcessing={isIntegrationProcessing}
              processingType={processingIntegrationType}
              disabled={isLoading || isConfirming || voiceSession.isActive}
            />
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              voiceSession.isActive
                ? isVoiceProcessing
                  ? "Traitement en cours..."
                  : "Parlez, je vous écoute..."
                : pendingEvent
                  ? "Confirmez ou refusez l'événement proposé..."
                  : "Tapez votre message..."
            }
            disabled={isLoading || isConfirming || voiceSession.isActive}
            className="flex-1 w-0 px-3 lg:px-4 py-2 lg:py-3 bg-notion-bg border border-notion-border rounded-lg text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <VoiceButton
            isActive={voiceSession.isActive}
            isConnecting={isVoiceProcessing}
            isListening={voiceSession.isListening}
            isSpeaking={voiceSession.isSpeaking}
            onClick={handleVoiceToggle}
            disabled={isLoading || isConfirming}
            error={voiceSession.error}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading || isConfirming || voiceSession.isActive}
            className="p-2.5 lg:px-6 lg:py-3 bg-notion-blue text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-notion-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
