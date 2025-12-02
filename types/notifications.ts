export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}

export interface NotificationContextType {
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
}

