'use client';

import type { Notification } from '@/types/notifications';
import NotificationCard from './NotificationCard';
import { Z_INDEX } from '@/lib/constants/ui-constants';

interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export default function NotificationContainer({
  notifications,
  onClose,
}: NotificationContainerProps) {
  return (
    <div className="fixed top-6 right-6 space-y-3 max-w-md pointer-events-none" style={{ zIndex: Z_INDEX.notification }}>
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

