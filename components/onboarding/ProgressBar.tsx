'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  labels?: string[];
}

/**
 * Barre de progression animée pour l'onboarding
 */
export function ProgressBar({ current, total, labels }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      {/* Barre de progression */}
      <div className="relative h-2 bg-notion-hover rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-notion-blue to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Indicateurs d'étapes */}
      <div className="flex justify-between">
        {Array.from({ length: total }, (_, i) => (
          <div 
            key={i}
            className={`flex flex-col items-center transition-all duration-300 ${
              i + 1 <= current ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div 
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i + 1 < current 
                  ? 'bg-notion-blue' 
                  : i + 1 === current 
                    ? 'bg-notion-blue ring-4 ring-notion-blue/20' 
                    : 'bg-notion-hover'
              }`}
            />
            {labels && labels[i] && (
              <span className={`text-xs mt-1 hidden sm:block ${
                i + 1 === current ? 'text-notion-blue font-medium' : 'text-notion-textLight'
              }`}>
                {labels[i]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Compteur mobile */}
      <div className="text-center text-sm text-notion-textLight sm:hidden">
        Étape {current} sur {total}
      </div>
    </div>
  );
}


