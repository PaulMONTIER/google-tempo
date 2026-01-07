'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from '@/components/ui/icons';
import type { Notification } from '@/types/notifications';

interface NotificationCardProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export default function NotificationCard({
  notification,
  onClose,
}: NotificationCardProps) {
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
    setTimeout(() => onClose(notification.id), 300);
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


