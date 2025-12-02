'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import type { Notification } from '@/types/notifications';
import NotificationContainer from './NotificationContainer';

// Extension du type Notification pour l'historique (avec timestamp)
interface NotificationWithTimestamp extends Notification {
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  notificationHistory: (NotificationWithTimestamp & { read: boolean })[];
  addNotification: (notification: Omit<NotificationWithTimestamp, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  deleteFromHistory: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<(NotificationWithTimestamp & { read: boolean })[]>([]);

  const addNotification = (notification: Omit<NotificationWithTimestamp, 'id' | 'timestamp'>) => {
    const newNotification: NotificationWithTimestamp = {
      ...notification,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Add to history
    setNotificationHistory((prev) => [{ ...newNotification, read: false }, ...prev]);

    // Auto remove from toast after duration
    if (notification.duration !== undefined && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotificationHistory((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotificationHistory((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearHistory = () => {
    setNotificationHistory([]);
  };

  const deleteFromHistory = (id: string) => {
    setNotificationHistory((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      notificationHistory,
      addNotification,
      removeNotification,
      clearAll,
      markAsRead,
      markAllAsRead,
      clearHistory,
      deleteFromHistory
    }}>
      {children}
      <NotificationContainerWrapper />
    </NotificationContext.Provider>
  );
}

function NotificationContainerWrapper() {
  const { notifications, removeNotification } = useNotifications();
  return (
    <NotificationContainer
      notifications={notifications}
      onClose={removeNotification}
    />
  );
}
