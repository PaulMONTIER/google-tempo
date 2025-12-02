'use client';

import { Sparkles, X } from '@/components/icons';

interface QuizCardProps {
  eventTitle: string;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

export function QuizCard({ eventTitle, onAccept, onDecline, onDismiss }: QuizCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Questionnaire de validation
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {eventTitle}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        Validez vos compétences avec un questionnaire de 10 questions (2 min max).
        Correction immédiate après chaque question.
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
        >
          Commencer
        </button>
        <button
          onClick={onDecline}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}


