'use client';

import { X } from '@/components/icons';

export interface Reminder {
  id: string;
  eventId: string;
  title: string;
  goalDate: Date;
  daysBefore: number;
  message: string;
  isUrgent: boolean;
}

interface ReminderCardProps {
  reminder: Reminder;
  onDismiss: (reminderId: string) => void;
}

export function ReminderCard({ reminder, onDismiss }: ReminderCardProps) {
  return (
    <div
      className={`
        relative p-4 rounded-lg shadow-sm border
        ${reminder.isUrgent 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {reminder.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {reminder.title}
          </p>
        </div>
        <button
          onClick={() => onDismiss(reminder.id)}
          className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}

