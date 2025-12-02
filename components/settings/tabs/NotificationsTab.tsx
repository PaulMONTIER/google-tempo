'use client';

import { Bell } from '@/components/icons';
import { Section } from '../components/Section';
import { ToggleSetting } from '../components/ToggleSetting';
import type { UserSettings } from '@/components/providers/settings-provider';

interface NotificationsTabProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

/**
 * Tab des paramètres de notifications
 */
export function NotificationsTab({ settings, updateSetting }: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <Section title="Préférences de notification" icon={Bell}>
        <div className="space-y-4">
          <ToggleSetting
            label="Notifications par email"
            description="Recevoir des emails pour les événements importants"
            enabled={settings.emailNotifications}
            onChange={(value) => updateSetting('emailNotifications', value)}
          />
          <ToggleSetting
            label="Notifications push"
            description="Recevoir des notifications sur cet appareil"
            enabled={settings.pushNotifications}
            onChange={(value) => updateSetting('pushNotifications', value)}
          />
          <ToggleSetting
            label="Rappels d'événements"
            description="Être notifié avant le début d'un événement"
            enabled={settings.eventReminders}
            onChange={(value) => updateSetting('eventReminders', value)}
          />
        </div>

        {settings.eventReminders && (
          <div className="mt-4 pt-4 border-t border-notion-border">
            <label className="block text-sm font-medium text-notion-text mb-2">
              Temps de rappel avant l'événement
            </label>
            <select
              value={settings.reminderTime}
              onChange={(e) => updateSetting('reminderTime', Number(e.target.value))}
              className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
              <option value={120}>2 heures</option>
              <option value={1440}>1 jour</option>
            </select>
          </div>
        )}
      </Section>
    </div>
  );
}

