'use client';

import { Mic, MicOff, Loader2, Volume2 } from '@/components/ui/icons';

interface VoiceButtonProps {
    isActive: boolean;
    isConnecting: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    onClick: () => void;
    disabled?: boolean;
    error?: string | null;
}

/**
 * Bouton toggle pour activer/désactiver le mode vocal
 * Affiche l'état actuel de la session vocale
 */
export function VoiceButton({
    isActive,
    isConnecting,
    isListening,
    isSpeaking,
    onClick,
    disabled = false,
    error
}: VoiceButtonProps) {
    // Déterminer l'icône et le style en fonction de l'état
    const getButtonContent = () => {
        if (isConnecting) {
            return <Loader2 className="w-5 h-5 animate-spin" />;
        }
        if (isSpeaking) {
            return <Volume2 className="w-5 h-5" />;
        }
        if (isActive || isListening) {
            return <Mic className="w-5 h-5" />;
        }
        return <Mic className="w-5 h-5" />;
    };

    const getButtonStyles = () => {
        const baseStyles = "relative px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

        if (disabled || isConnecting) {
            return `${baseStyles} bg-notion-border text-notion-textLight cursor-not-allowed opacity-50`;
        }

        if (error) {
            return `${baseStyles} bg-red-500 text-white hover:bg-red-600 focus:ring-red-500`;
        }

        if (isSpeaking) {
            return `${baseStyles} bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 animate-pulse`;
        }

        if (isActive || isListening) {
            return `${baseStyles} bg-red-500 text-white hover:bg-red-600 focus:ring-red-500`;
        }

        return `${baseStyles} bg-notion-sidebar text-notion-text hover:bg-notion-border focus:ring-notion-blue`;
    };

    const getTooltip = () => {
        if (isConnecting) return 'Connexion en cours...';
        if (isSpeaking) return 'Tempo parle...';
        if (isListening) return 'Cliquez pour arrêter';
        if (error) return error;
        return 'Activer l\'assistant vocal';
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || isConnecting}
            className={getButtonStyles()}
            title={getTooltip()}
            aria-label={getTooltip()}
        >
            {getButtonContent()}

            {/* Indicateur de pulsation pour l'écoute active */}
            {isListening && !isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}

            {/* Indicateur pour quand Gemini parle */}
            {isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            )}
        </button>
    );
}
