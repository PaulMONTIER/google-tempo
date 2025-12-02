'use client';

import { ReminderCard, type Reminder } from './ReminderCard';

interface ReminderListProps {
  reminders: Reminder[];
  onDismiss: (reminderId: string) => void;
}

export function ReminderList({ reminders, onDismiss }: ReminderListProps) {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

