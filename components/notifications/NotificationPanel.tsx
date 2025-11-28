'use client';

import { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, XCircle } from '@/components/icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from './NotificationSystem';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const {
    notificationHistory,
    markAsRead,
    markAllAsRead,
    clearHistory,
    deleteFromHistory
  } = useNotifications();

  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const unreadCount = notificationHistory.filter((n) => !n.read).length;

  // IMPORTANT: useEffect doit être appelé avant tout return conditionnel
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;

    return format(timestamp, 'd MMM', { locale: fr });
  };

  const getTypeConfig = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-[#4dab9a]',
          bg: 'bg-[#4dab9a]/10',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-[#dfab01]',
          bg: 'bg-[#dfab01]/10',
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-[#e74c3c]',
          bg: 'bg-[#e74c3c]/10',
        };
      default:
        return {
          icon: Info,
          color: 'text-notion-blue',
          bg: 'bg-notion-blueLight',
        };
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-[60] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-4 top-20 w-full sm:w-[420px] bg-notion-bg rounded-xl shadow-2xl z-[70] transition-all duration-300 ease-out max-h-[calc(100vh-100px)] flex flex-col ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-notion-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-notion-blue/10 rounded-lg">
                <Bell className="w-5 h-5 text-notion-blue" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-notion-text">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-notion-textLight">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
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

          {/* Actions */}
          {notificationHistory.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-notion-blue hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button
                onClick={clearHistory}
                className="text-xs font-medium text-notion-textLight hover:text-notion-red transition-colors"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notificationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 bg-notion-sidebar rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-notion-textLight" />
              </div>
              <h3 className="text-base font-medium text-notion-text mb-1">
                Aucune notification
              </h3>
              <p className="text-sm text-notion-textLight">
                Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-notion-border">
              {notificationHistory.map((notification) => {
                const config = getTypeConfig(notification.type);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 hover:bg-notion-hover transition-colors cursor-pointer group ${
                      !notification.read ? 'bg-notion-blue/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`${config.bg} rounded-lg p-2 flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-notion-text text-sm flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <span className="w-2 h-2 bg-notion-blue rounded-full flex-shrink-0" />
                            )}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFromHistory(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-notion-border rounded transition-all"
                          >
                            <X className="w-3.5 h-3.5 text-notion-textLight" />
                          </button>
                        </div>
                        <p className="text-sm text-notion-textLight leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-notion-textLight/70">
                          {getTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
