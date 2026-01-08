'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';

/**
 * Hook pour gérer l'historique des messages du chat
 * Responsabilité unique: stockage et manipulation des messages
 */
export function useMessageHistory() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesRef = useRef<ChatMessage[]>([]);

    // Synchroniser messages avec ref pour éviter les problèmes de closure
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'> & { metadata?: Record<string, unknown> }) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            content: message.content,
            role: message.role,
            timestamp: new Date(),
            metadata: message.metadata,
        };
        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
    }, []);

    const addUserMessage = useCallback((content: string) => {
        return addMessage({ content, role: 'user' });
    }, [addMessage]);

    const addAssistantMessage = useCallback((content: string, metadata?: Record<string, unknown>) => {
        return addMessage({ content, role: 'assistant', metadata });
    }, [addMessage]);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const getMessagesForApi = useCallback(() => {
        return messagesRef.current.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
        }));
    }, []);

    return {
        messages,
        messagesRef,
        addMessage,
        addUserMessage,
        addAssistantMessage,
        clearMessages,
        getMessagesForApi,
    };
}
