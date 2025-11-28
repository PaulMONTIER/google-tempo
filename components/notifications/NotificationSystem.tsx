'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from '@/components/icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  notificationHistory: (Notification & { read: boolean })[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
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
  const [notificationHistory, setNotificationHistory] = useState<(Notification & { read: boolean })[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
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
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationCard({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const getTypeConfig = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-notion-green',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-notion-yellow',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-notion-red',
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-notion-blue',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div
      className={`bg-notion-bg border border-notion-border rounded-lg pointer-events-auto transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-notion-text text-sm leading-relaxed">
            {notification.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="text-notion-textLight hover:text-notion-text hover:bg-notion-hover rounded p-1 transition-all flex-shrink-0 -mr-1 -mt-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
