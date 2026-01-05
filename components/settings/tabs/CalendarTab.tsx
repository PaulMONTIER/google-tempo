'use client';

import { Calendar, Sparkles } from '@/components/icons';
import { Section } from '../components/Section';
import { ToggleSetting } from '../components/ToggleSetting';
import type { UserSettings } from '@/components/providers/settings-provider';

interface CalendarTabProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

/**
 * Tab des paramètres du calendrier
 */
export function CalendarTab({ settings, updateSetting }: CalendarTabProps) {
  return (
    <div className="space-y-6">
      <Section title="Affichage du calendrier" icon={Calendar}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-notion-text mb-2">
              Vue par défaut
            </label>
            <select
              value={settings.defaultView}
              onChange={(e) => updateSetting('defaultView', e.target.value as 'month' | 'week' | 'day')}
              className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
            >
              <option value="month">Mois</option>
              <option value="week">Semaine</option>
              <option value="day">Jour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text mb-2">
              Début de la semaine
            </label>
            <select
              value={settings.weekStartsOn}
              onChange={(e) => updateSetting('weekStartsOn', Number(e.target.value) as 0 | 1)}
              className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
            >
              <option value={0}>Dimanche</option>
              <option value={1}>Lundi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text mb-2">
              Format de l'heure
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => updateSetting('timeFormat', '12h')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${settings.timeFormat === '12h'
                  ? 'border-notion-blue bg-notion-blue/5 text-notion-text'
                  : 'border-notion-border text-notion-textLight hover:border-notion-blue/50'
                  }`}
              >
                12h (AM/PM)
              </button>
              <button
                onClick={() => updateSetting('timeFormat', '24h')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${settings.timeFormat === '24h'
                  ? 'border-notion-blue bg-notion-blue/5 text-notion-text'
                  : 'border-notion-border text-notion-textLight hover:border-notion-blue/50'
                  }`}
              >
                24h
              </button>
            </div>
          </div>

          <ToggleSetting
            label="Afficher les numéros de semaine"
            description="Voir le numéro de la semaine dans l'année"
            enabled={settings.showWeekNumbers}
            onChange={(value) => updateSetting('showWeekNumbers', value)}
          />
        </div>
      </Section>

      {/* 🆕 Section Agent IA */}
      <Section title="Assistant IA" icon={Sparkles}>
        <div className="space-y-4">
          <ToggleSetting
            label="Confirmer avant création"
            description="Demander confirmation avant d'ajouter un événement au calendrier"
            enabled={settings.requireEventConfirmation}
            onChange={(value) => updateSetting('requireEventConfirmation', value)}
          />
        </div>
      </Section>
    </div>
  );
}
