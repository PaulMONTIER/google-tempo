'use client';

interface ProgressRingProps {
    /** Progression de 0 à 100 */
    progress: number;
    /** Taille du cercle en pixels */
    size?: number;
    /** Épaisseur du trait */
    strokeWidth?: number;
    /** Couleur de la progression (classe Tailwind sans le préfixe) */
    color?: 'blue' | 'green' | 'red' | 'orange';
    /** Afficher le pourcentage au centre */
    showPercentage?: boolean;
}

const colorMap = {
    blue: 'stroke-notion-blue',
    green: 'stroke-notion-green',
    red: 'stroke-notion-red',
    orange: 'stroke-notion-orange',
};

/**
 * Composant Progress Ring style Apple Watch
 */
export function ProgressRing({
    progress,
    size = 48,
    strokeWidth = 4,
    color = 'green',
    showPercentage = true,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className="stroke-notion-border"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className={`${colorMap[color]} transition-all duration-500 ease-out`}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            {showPercentage && (
                <span className="absolute text-xs font-semibold text-notion-text">
                    {Math.round(progress)}%
                </span>
            )}
        </div>
    );
}
