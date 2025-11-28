'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserSettings {
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  eventReminders: boolean;
  reminderTime: number;

  // Appearance
  theme: 'light' | 'dark' | 'auto';
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
  theme: 'light',
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
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Helper function to apply accent color CSS variables
  const applyAccentColor = (color: string) => {
    // Set the hex value for inline styles
    document.documentElement.style.setProperty('--accent-color', color);

    // Calculate RGB values for Tailwind
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Set RGB values (space-separated for Tailwind 3 opacity modifier support)
    document.documentElement.style.setProperty('--accent-color-rgb', `${r} ${g} ${b}`);

    // Set light version for backgrounds
    document.documentElement.style.setProperty(
      '--accent-color-light',
      `rgba(${r}, ${g}, ${b}, 0.1)`
    );
  };

  // Apply accent color as CSS variable
  useEffect(() => {
    applyAccentColor(settings.accentColor);
  }, [settings.accentColor]);

  // Apply theme
  useEffect(() => {
    if (isLoaded) {
      const root = document.documentElement;

      const applyTheme = (isDark: boolean) => {
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      if (settings.theme === 'dark') {
        applyTheme(true);
      } else if (settings.theme === 'light') {
        applyTheme(false);
      } else {
        // Auto: follow system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(mediaQuery.matches);

        // Listen for system preference changes
        const handleChange = (e: MediaQueryListEvent) => {
          if (settings.theme === 'auto') {
            applyTheme(e.matches);
          }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, [settings.theme, isLoaded]);

  // Helper function to apply theme
  const applyThemeDirectly = (theme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto: follow system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('tempo-settings', JSON.stringify(newSettings));

      // Apply accent color immediately when it changes
      if (key === 'accentColor' && typeof value === 'string') {
        applyAccentColor(value);
      }

      // Apply theme immediately when it changes
      if (key === 'theme' && (value === 'light' || value === 'dark' || value === 'auto')) {
        applyThemeDirectly(value);
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
