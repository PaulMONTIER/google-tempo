'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle } from '@/components/icons';
import { useTaskValidations } from '@/hooks/use-task-validations';
import { TaskValidationCard } from './TaskValidationCard';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface TaskValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskValidationPanel({ isOpen, onClose }: TaskValidationPanelProps) {
  const { tasks, pendingCount, isLoading, validateTask, dismissTask } = useTaskValidations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, DURATIONS.animation);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity`}
        style={{
          zIndex: Z_INDEX.modalOverlay,
          transitionDuration: `${DURATIONS.animation}ms`,
          opacity: isVisible ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-4 top-20 w-full sm:w-[420px] bg-notion-bg rounded-xl shadow-2xl transition-all ease-out max-h-[calc(100vh-100px)] flex flex-col ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
        style={{
          zIndex: Z_INDEX.modal,
          transitionDuration: `${DURATIONS.animation}ms`,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-notion-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-notion-text">Validation des Tâches</h2>
                {pendingCount > 0 && (
                  <p className="text-xs text-notion-textLight">
                    {pendingCount} tâche{pendingCount > 1 ? 's' : ''} à valider
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-notion-textLight" />
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base font-medium text-notion-text mb-1">
                Aucune tâche à valider
              </h3>
              <p className="text-sm text-notion-textLight">
                Toutes vos tâches sont à jour !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskValidationCard
                  key={task.id}
                  task={task}
                  onValidate={validateTask}
                  onDismiss={dismissTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


