'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    GoogleGenAI, Modality, type LiveServerMessage
} from '@google/genai';

interface UseGeminiLiveOptions {
    onTranscript?: (text: string, isUser: boolean) => void;
    onFunctionCall?: (name: string, args: Record<string, unknown>, result: unknown) => void;
    onSessionEnd?: (summary: string) => void;
    onError?: (error: string) => void;
}

interface UseGeminiLiveReturn {
    isActive: boolean;
    isConnecting: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    error: string | null;
    startSession: () => Promise<void>;
    stopSession: () => void;
}

interface LiveSession {
    sendRealtimeInput: (input: { audio: { data: string; mimeType: string } }) => void;
    sendToolResponse: (response: { functionResponses: FunctionResponse[] }) => void;
    close: () => void;
}

interface FunctionResponse {
    id: string;
    name: string;
    response: { result: unknown };
}

/**
 * Hook pour gérer une session vocale Gemini Live
 * Gère la capture audio, la connexion WebSocket, et la lecture audio
 */
export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
    const { onTranscript, onFunctionCall, onSessionEnd, onError } = options;

    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs pour les ressources audio
    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const transcriptRef = useRef<string[]>([]);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);

    /**
     * Joue l'audio de la queue
     */
    const playAudioQueue = useCallback(async () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

        isPlayingRef.current = true;
        setIsSpeaking(true);

        const audioContext = audioContextRef.current;
        if (!audioContext) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        while (audioQueueRef.current.length > 0) {
            const audioData = audioQueueRef.current.shift();
            if (!audioData) continue;

            // Créer un buffer audio (24kHz mono)
            const audioBuffer = audioContext.createBuffer(1, audioData.length, 24000);
            audioBuffer.getChannelData(0).set(audioData);

            // Jouer le buffer
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            await new Promise<void>((resolve) => {
                source.onended = () => resolve();
                source.start();
            });
        }

        isPlayingRef.current = false;
        setIsSpeaking(false);
    }, []);

    /**
     * Traite un message reçu de Gemini Live
     */
    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        // Interruption - vider la queue audio
        if (message.serverContent?.interrupted) {
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        // Contenu audio ou texte
        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                // Texte (transcription)
                if (part.text) {
                    transcriptRef.current.push(`Assistant: ${part.text}`);
                    onTranscript?.(part.text, false);
                }

                // Audio
                if (part.inlineData?.data) {
                    // Décoder le base64 en PCM 16-bit
                    const binaryString = atob(part.inlineData.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Convertir Int16 en Float32 pour Web Audio
                    const int16Array = new Int16Array(bytes.buffer);
                    const float32Array = new Float32Array(int16Array.length);
                    for (let i = 0; i < int16Array.length; i++) {
                        float32Array[i] = int16Array[i] / 32768.0;
                    }

                    audioQueueRef.current.push(float32Array);
                    playAudioQueue();
                }
            }
        }

        // Appel de fonction
        if (message.toolCall?.functionCalls) {
            for (const fc of message.toolCall.functionCalls) {
                console.log(`[Voice] Function call: ${fc.name}`, fc.args);

                try {
                    // Exécuter l'outil via le backend
                    const response = await fetch('/api/voice/execute-tool', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            toolName: fc.name,
                            args: fc.args
                        })
                    });

                    const result = await response.json();

                    // Notifier le callback
                    const funcName = fc.name || 'unknown';
                    const funcId = fc.id || '';
                    onFunctionCall?.(funcName, (fc.args || {}) as Record<string, unknown>, result);

                    // Envoyer la réponse à Gemini
                    sessionRef.current?.sendToolResponse({
                        functionResponses: [{
                            id: funcId,
                            name: funcName,
                            response: { result }
                        }]
                    });

                    // Ajouter à la transcription
                    transcriptRef.current.push(`[Action: ${fc.name}] ${JSON.stringify(result)}`);

                } catch (err) {
                    console.error(`[Voice] Tool execution error:`, err);

                    // Envoyer une réponse d'erreur
                    const errFuncName = fc.name || 'unknown';
                    const errFuncId = fc.id || '';
                    sessionRef.current?.sendToolResponse({
                        functionResponses: [{
                            id: errFuncId,
                            name: errFuncName,
                            response: { result: { error: 'Erreur lors de l\'exécution' } }
                        }]
                    });
                }
            }
        }
    }, [onTranscript, onFunctionCall, playAudioQueue]);

    /**
     * Configure la capture audio du microphone
     */
    const setupAudioCapture = useCallback(async (stream: MediaStream, session: LiveSession) => {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);

        // Utiliser ScriptProcessor (déprécié mais plus simple pour le POC)
        // TODO: Migrer vers AudioWorklet pour la production
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
            if (!sessionRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);

            // Convertir Float32 en Int16
            const int16Array = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Encoder en base64
            const uint8Array = new Uint8Array(int16Array.buffer);
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const base64Audio = btoa(binary);

            // Envoyer à Gemini
            session.sendRealtimeInput({
                audio: {
                    data: base64Audio,
                    mimeType: 'audio/pcm;rate=16000'
                }
            });
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
    }, []);

    /**
     * Démarre la session vocale
     */
    const startSession = useCallback(async () => {
        if (isActive || isConnecting) return;

        setIsConnecting(true);
        setError(null);
        transcriptRef.current = [];

        try {
            // 1. Demander l'accès au microphone
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            mediaStreamRef.current = stream;

            // 2. Récupérer le token éphémère
            const tokenResponse = await fetch('/api/voice/token');
            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                throw new Error(errorData.error || 'Impossible de récupérer le token');
            }
            const { token } = await tokenResponse.json();

            // 3. Créer le contexte audio pour la lecture
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });

            // 4. Connecter à Gemini Live
            const ai = new GoogleGenAI({ apiKey: token });

            const session = await ai.live.connect({
                model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                },
                callbacks: {
                    onopen: () => {
                        console.log('[Voice] Connected to Gemini Live');
                        setIsActive(true);
                        setIsConnecting(false);
                        setIsListening(true);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        handleMessage(message);
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('[Voice] Error:', e);
                        setError(e.message || 'Erreur de connexion');
                        onError?.(e.message || 'Erreur de connexion');
                    },
                    onclose: () => {
                        console.log('[Voice] Connection closed');
                        setIsActive(false);
                        setIsListening(false);
                    }
                }
            });

            sessionRef.current = session as unknown as LiveSession;

            // 5. Configurer la capture audio
            await setupAudioCapture(stream, session as unknown as LiveSession);

        } catch (err) {
            console.error('[Voice] Start session error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            onError?.(errorMessage);
            setIsConnecting(false);
            cleanup();
        }
    }, [isActive, isConnecting, handleMessage, onError, setupAudioCapture]);

    /**
     * Nettoie les ressources
     */
    const cleanup = useCallback(() => {
        // Fermer la session Gemini
        if (sessionRef.current) {
            try {
                sessionRef.current.close();
            } catch (e) {
                console.error('[Voice] Error closing session:', e);
            }
            sessionRef.current = null;
        }

        // Arrêter le flux média
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Fermer le contexte audio
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Arrêter le worklet
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        // Vider la queue audio
        audioQueueRef.current = [];
        isPlayingRef.current = false;

        // Réinitialiser les états
        setIsActive(false);
        setIsConnecting(false);
        setIsListening(false);
        setIsSpeaking(false);
    }, []);

    /**
     * Arrête la session vocale
     */
    const stopSession = useCallback(() => {
        // Générer le résumé
        const summary = transcriptRef.current.join('\n');

        // Fermer la session
        cleanup();

        // Notifier la fin
        if (summary) {
            onSessionEnd?.(summary);
        }
    }, [onSessionEnd, cleanup]);

    // Cleanup à la démonture du composant
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        isActive,
        isConnecting,
        isListening,
        isSpeaking,
        error,
        startSession,
        stopSession
    };
}
