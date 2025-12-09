'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, PendingEventResponse, PendingEvent } from '@/types';
import { Send, Loader2 } from '@/components/icons';
import { EventConfirmationCard } from './EventConfirmationCard';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  // 🆕 Props pour la confirmation d'événements
  pendingEvent?: PendingEventResponse | null;
  isConfirming?: boolean;
  onConfirmEvent?: () => Promise<void>;
  onModifyEvent?: () => void;
  onRejectEvent?: (reason?: string) => Promise<void>;
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
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col bg-notion-bg rounded-lg shadow-sm border border-notion-border" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-notion-border" style={{ flexShrink: 0 }}>
        <h2 className="text-lg font-semibold text-notion-text">Tempo</h2>
        <p className="text-xs text-notion-textLight">
          Assistant calendrier
        </p>
      </div>

      {/* Messages */}
      <div className="px-6 py-4 space-y-4" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-notion-textLight">
              <p className="text-lg mb-2">Bonjour ! Je suis Tempo</p>
              <p className="text-sm">Comment puis-je vous aider avec votre calendrier aujourd hui ?</p>
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

        {/* 🆕 Carte de confirmation pour les événements en attente */}
        {pendingEvent && onConfirmEvent && onModifyEvent && onRejectEvent && (
          <EventConfirmationCard
            pendingEvent={pendingEvent}
            onAccept={onConfirmEvent}
            onModify={onModifyEvent}
            onReject={onRejectEvent}
            isLoading={isConfirming}
          />
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-notion-sidebar text-notion-text rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-notion-border" style={{ flexShrink: 0 }}>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingEvent ? "Confirmez ou refusez l'événement proposé..." : "Tapez votre message..."}
            disabled={isLoading || isConfirming}
            className="flex-1 px-4 py-3 bg-notion-bg border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isConfirming}
            className="px-6 py-3 bg-notion-blue text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-notion-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

