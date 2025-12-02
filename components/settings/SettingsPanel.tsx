'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Bell, Palette, Calendar } from '@/components/icons';
import { useSettings, UserSettings } from '@/components/providers/settings-provider';
import { AccountTab, NotificationsTab, AppearanceTab, CalendarTab } from './tabs';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'account' | 'notifications' | 'appearance' | 'calendar';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { data: session } = useSession();
  const { settings, updateSetting } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // User info from session
  const userInfo = {
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    avatar: session?.user?.name?.slice(0, 2).toUpperCase() || 'U',
  };

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, DURATIONS.animation);
  };

  const handleUpdateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    updateSetting(key, value);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), DURATIONS.twoSeconds);
  };

  const tabs = [
    { id: 'account' as SettingsTab, label: 'Compte', icon: User },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'appearance' as SettingsTab, label: 'Apparence', icon: Palette },
    { id: 'calendar' as SettingsTab, label: 'Calendrier', icon: Calendar },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity`}
        style={{ 
          zIndex: Z_INDEX.modalOverlay,
          transitionDuration: `${DURATIONS.animation}ms`,
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: Z_INDEX.modal }}>
        <div
          className={`w-full max-w-3xl max-h-[85vh] bg-notion-bg rounded-xl shadow-2xl pointer-events-auto transition-all ease-out flex flex-col ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ transitionDuration: `${DURATIONS.animation}ms` }}
        >
          {/* Header */}
          <div className="bg-notion-bg border-b border-notion-border px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-notion-text">Paramètres</h2>
              <p className="text-sm text-notion-textLight mt-0.5">
                {isSaved ? (
                  <span className="text-green-600">Enregistré automatiquement</span>
                ) : (
                  'Gérez vos préférences et votre compte'
                )}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-notion-textLight" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-48 border-r border-notion-border bg-notion-sidebar/30 p-3 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-notion-bg text-notion-text shadow-sm'
                          : 'text-notion-textLight hover:bg-white/50 hover:text-notion-text'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'account' && <AccountTab userInfo={userInfo} />}
              {activeTab === 'notifications' && <NotificationsTab settings={settings} updateSetting={handleUpdateSetting} />}
              {activeTab === 'appearance' && <AppearanceTab settings={settings} updateSetting={handleUpdateSetting} />}
              {activeTab === 'calendar' && <CalendarTab settings={settings} updateSetting={handleUpdateSetting} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
