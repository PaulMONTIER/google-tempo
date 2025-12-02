'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeManager } from '@/lib/theme/theme-manager';
import { AccentColorManager } from '@/lib/theme/accent-color-manager';
import { logger } from '@/lib/utils/logger';

export interface UserSettings {
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  eventReminders: boolean;
  reminderTime: number;

  // Appearance
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  language: string;

  // Calendar
  weekStartsOn: 0 | 1;
  defaultView: 'month' | 'week' | 'day';
  timeFormat: '12h' | '24h';
  showWeekNumbers: boolean;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  isLoaded: boolean;
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  eventReminders: true,
  reminderTime: 15,
  theme: 'system',
  accentColor: '#2383e2',
  language: 'fr',
  weekStartsOn: 1,
  defaultView: 'month',
  timeFormat: '24h',
  showWeekNumbers: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tempo-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Migration : 'auto' -> 'system'
        if (parsed.theme === 'auto') {
          parsed.theme = 'system';
        }
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        logger.error('Failed to parse settings:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Apply accent color as CSS variable
  useEffect(() => {
    if (isLoaded) {
      const effectiveTheme = settings.theme === 'system' 
        ? ThemeManager.getSystemTheme() 
        : settings.theme;
      AccentColorManager.applyAccentColor(settings.accentColor, effectiveTheme);
    }
  }, [settings.accentColor, settings.theme, isLoaded]);

  // Apply theme
  useEffect(() => {
    if (isLoaded) {
      ThemeManager.applyTheme(settings.theme);

      // Si le thème est 'system', écouter les changements système
      if (settings.theme === 'system') {
        const cleanup = ThemeManager.watchSystemTheme(() => {
          ThemeManager.applyTheme('system');
        });
        return cleanup;
      }
    }
  }, [settings.theme, isLoaded]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('tempo-settings', JSON.stringify(newSettings));

      // Apply accent color immediately when it changes
      if (key === 'accentColor' && typeof value === 'string') {
        const effectiveTheme = prev.theme === 'system' 
          ? ThemeManager.getSystemTheme() 
          : prev.theme;
        AccentColorManager.applyAccentColor(value, effectiveTheme);
      }

      // Apply theme immediately when it changes
      if (key === 'theme' && (value === 'light' || value === 'dark' || value === 'system')) {
        ThemeManager.applyTheme(value);
      }

      return newSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}
