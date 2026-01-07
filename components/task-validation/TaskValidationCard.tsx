'use client';

import { useState } from 'react';
import { CheckCircle, X, XCircle } from '@/components/ui/icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TaskValidationData } from '@/lib/gamification/task-validation-service';

interface TaskValidationCardProps {
  task: TaskValidationData;
  onValidate: (validationId: string, completed: boolean) => Promise<void>;
  onDismiss: (validationId: string) => void;
  onQuizProposal?: (eventId: string, eventTitle: string) => void;
}

export function TaskValidationCard({
  task,
  onValidate,
  onDismiss,
  onQuizProposal,
}: TaskValidationCardProps) {
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async (completed: boolean) => {
    setIsValidating(true);
    try {
      await onValidate(task.id, completed);
      // Si la tâche est complétée, vérifier si un quiz doit être proposé
      if (completed && onQuizProposal) {
        // Petit délai pour laisser le temps à la validation de se terminer
        setTimeout(() => {
          onQuizProposal(task.eventId, task.eventTitle);
        }, 500);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await onDismiss(task.id);
    } catch (err) {
      console.error('Erreur dismiss:', err);
    }
  };

  const isPast = new Date(task.eventDate) < new Date();

  return (
    <div
      className={`
        relative p-4 rounded-lg shadow-sm border
        ${isPast 
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {task.eventTitle}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(task.eventDate), 'd MMMM yyyy', { locale: fr })}
            {isPast && ' (passé)'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Ignorer"
        >
          <XCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleValidate(true)}
          disabled={isValidating}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          Complétée
        </button>
        <button
          onClick={() => handleValidate(false)}
          disabled={isValidating}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Non faite
        </button>
      </div>
    </div>
  );
}

