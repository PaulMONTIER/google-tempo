'use client';

interface VoiceIndicatorProps {
    isActive: boolean;
    isListening: boolean;
    isSpeaking: boolean;
}

/**
 * Indicateur visuel de l'activité audio
 * Affiche des barres d'équaliseur animées
 */
export function VoiceIndicator({
    isActive,
    isListening,
    isSpeaking
}: VoiceIndicatorProps) {
    if (!isActive) return null;

    return (
        <div className="flex items-center justify-center gap-1 px-3 py-2 bg-notion-sidebar rounded-lg">
            {/* Barres d'équaliseur */}
            <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${isSpeaking
                                ? 'bg-green-500'
                                : isListening
                                    ? 'bg-red-500'
                                    : 'bg-notion-textLight'
                            }`}
                        style={{
                            height: isListening || isSpeaking
                                ? `${Math.random() * 12 + 4}px`
                                : '4px',
                            animation: (isListening || isSpeaking)
                                ? `equalizer ${0.3 + i * 0.1}s ease-in-out infinite alternate`
                                : 'none'
                        }}
                    />
                ))}
            </div>

            {/* Label d'état */}
            <span className={`text-xs ml-2 ${isSpeaking ? 'text-green-600' : isListening ? 'text-red-600' : 'text-notion-textLight'
                }`}>
                {isSpeaking ? 'Tempo parle...' : isListening ? 'Écoute...' : ''}
            </span>

            {/* Styles d'animation */}
            <style jsx>{`
        @keyframes equalizer {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
        </div>
    );
}
