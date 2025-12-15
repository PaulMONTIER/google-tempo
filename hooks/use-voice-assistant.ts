'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceAssistantOptions {
    onTranscript?: (text: string) => void;
    onError?: (error: string) => void;
    autoStop?: boolean; // Si true, le micro se coupe après chaque phrase
}

interface UseVoiceAssistantReturn {
    isActive: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    isProcessing: boolean;
    error: string | null;
    transcript: string;
    startSession: () => void;
    stopSession: () => void;
    speak: (text: string) => void;
}

// Déclaration pour TypeScript - Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: Event & { error: string }) => void) | null;
    onstart: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

/**
 * Hook pour l'assistant vocal utilisant Web Speech API
 * - Reconnaissance vocale native du navigateur
 * - Synthèse vocale pour les réponses
 */
export function useVoiceAssistant(
    options: UseVoiceAssistantOptions = {}
): UseVoiceAssistantReturn {
    const { onTranscript, onError, autoStop = false } = options;

    const [isActive, setIsActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isActiveRef = useRef(false);
    const autoStopRef = useRef(autoStop);
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    // Garder les refs synchronisées
    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    useEffect(() => {
        autoStopRef.current = autoStop;
    }, [autoStop]);

    /**
     * Synthèse vocale - fait parler le navigateur
     */
    const speak = useCallback((text: string) => {
        if (!text || !('speechSynthesis' in window)) {
            console.warn('[Voice] Speech synthesis not supported or empty text');
            return;
        }

        // Arrêter toute synthèse en cours
        window.speechSynthesis.cancel();

        // Limiter la longueur du texte pour éviter les blocages
        const maxLength = 500;
        const textToSpeak = text.length > maxLength
            ? text.substring(0, maxLength) + '...'
            : text;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.1; // Légèrement plus rapide
        utterance.pitch = 1.0;

        // Chercher une voix française
        const voices = window.speechSynthesis.getVoices();
        const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frenchVoice) {
            utterance.voice = frenchVoice;
        }

        utterance.onstart = () => {
            console.log('[Voice] Speaking started');
            setIsSpeaking(true);
            setIsProcessing(false);
        };

        utterance.onend = () => {
            console.log('[Voice] Speaking ended');
            setIsSpeaking(false);
            // Reprendre l'écoute après avoir parlé si la session est active ET autoStop désactivé
            if (isActiveRef.current && recognitionRef.current && !autoStopRef.current) {
                setTimeout(() => {
                    if (isActiveRef.current && recognitionRef.current && !autoStopRef.current) {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            // Ignorer si déjà en cours
                        }
                    }
                }, 300);
            } else if (autoStopRef.current) {
                // En mode autoStop, on désactive la session après avoir parlé
                console.log('[Voice] AutoStop: session terminée après réponse');
                setIsActive(false);
            }
        };

        utterance.onerror = (e) => {
            console.error('[Voice] Speech error:', e);
            setIsSpeaking(false);
            setIsProcessing(false);
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    /**
     * Démarre la session vocale
     */
    const startSession = useCallback(() => {
        // Vérifier le support
        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionClass) {
            const errorMsg = 'La reconnaissance vocale n\'est pas supportée. Utilisez Chrome ou Edge.';
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        setError(null);
        setTranscript('');
        setIsActive(true);
        retryCountRef.current = 0;

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';

        recognition.onstart = () => {
            console.log('[Voice] Listening started');
            setIsListening(true);
            retryCountRef.current = 0; // Reset retry count on successful start
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setTranscript(finalTranscript || interimTranscript);

            if (finalTranscript) {
                console.log('[Voice] Final transcript:', finalTranscript);
                setIsListening(false);
                setIsProcessing(true);
                onTranscript?.(finalTranscript);
            }
        };

        recognition.onend = () => {
            console.log('[Voice] Recognition ended');
            setIsListening(false);

            // Redémarrer si la session est toujours active et qu'on ne parle/traite pas
            if (isActiveRef.current && !isSpeaking && !isProcessing) {
                setTimeout(() => {
                    if (isActiveRef.current && recognitionRef.current && !isSpeaking) {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            console.log('[Voice] Could not restart:', e);
                        }
                    }
                }, 200);
            }
        };

        recognition.onerror = (event: Event & { error: string }) => {
            // Ignorer les erreurs normales
            if (event.error === 'no-speech' || event.error === 'aborted') {
                setIsListening(false);
                // Redémarrer silencieusement
                if (isActiveRef.current) {
                    setTimeout(() => {
                        if (isActiveRef.current && recognitionRef.current) {
                            try {
                                recognitionRef.current.start();
                            } catch (e) {
                                // Ignorer
                            }
                        }
                    }, 500);
                }
                return;
            }

            console.error('[Voice] Recognition error:', event.error);

            if (event.error === 'not-allowed') {
                setError('Accès au microphone refusé');
                setIsActive(false);
            } else if (event.error === 'network') {
                // Retry avec backoff exponentiel
                retryCountRef.current++;
                if (retryCountRef.current <= maxRetries) {
                    const delay = Math.pow(2, retryCountRef.current) * 500;
                    console.log(`[Voice] Network error, retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
                    setTimeout(() => {
                        if (isActiveRef.current && recognitionRef.current) {
                            try {
                                recognitionRef.current.start();
                            } catch (e) {
                                // Ignorer
                            }
                        }
                    }, delay);
                } else {
                    setError('Erreur réseau. Vérifiez votre connexion.');
                }
            } else {
                setError(`Erreur: ${event.error}`);
            }

            setIsListening(false);
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (e) {
            console.error('[Voice] Start error:', e);
            setError('Impossible de démarrer la reconnaissance vocale');
            setIsActive(false);
        }
    }, [onTranscript, onError, isSpeaking, isProcessing]);

    /**
     * Arrête la session vocale
     */
    const stopSession = useCallback(() => {
        console.log('[Voice] Stopping session');
        setIsActive(false);
        setIsListening(false);
        setIsSpeaking(false);
        setIsProcessing(false);
        setTranscript('');

        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) {
                // Ignorer
            }
            recognitionRef.current = null;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignorer
                }
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Charger les voix au montage
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }, []);

    return {
        isActive,
        isListening,
        isSpeaking,
        isProcessing,
        error,
        transcript,
        startSession,
        stopSession,
        speak
    };
}
