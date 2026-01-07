'use client';

import { Moon, Sun, Palette, Globe, Eye } from '@/components/ui/icons';
import { Section } from '../components/Section';
import type { UserSettings } from '@/components/providers/settings-provider';

interface AppearanceTabProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

/**
 * Tab des paramètres d'apparence
 */
export function AppearanceTab({ settings, updateSetting }: AppearanceTabProps) {
  const colors = [
    { name: 'Bleu', value: '#2383e2' },
    { name: 'Violet', value: '#9065b0' },
    { name: 'Rose', value: '#e255a1' },
    { name: 'Orange', value: '#d9730d' },
    { name: 'Jaune', value: '#dfab01' },
    { name: 'Vert', value: '#4dab9a' },
  ];

  return (
    <div className="space-y-6">
      <Section title="Thème" icon={Moon}>
        <div className="space-y-3">
          <button
            onClick={() => updateSetting('theme', 'light')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
              settings.theme === 'light'
                ? 'border-notion-blue bg-notion-blue/5'
                : 'border-notion-border hover:border-notion-blue/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium text-notion-text">Clair</div>
                <div className="text-xs text-notion-textLight">Thème lumineux</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => updateSetting('theme', 'dark')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
              settings.theme === 'dark'
                ? 'border-notion-blue bg-notion-blue/5'
                : 'border-notion-border hover:border-notion-blue/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium text-notion-text">Sombre</div>
                <div className="text-xs text-notion-textLight">Thème sombre</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => updateSetting('theme', 'system')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
              settings.theme === 'system'
                ? 'border-notion-blue bg-notion-blue/5'
                : 'border-notion-border hover:border-notion-blue/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium text-notion-text">Automatique</div>
                <div className="text-xs text-notion-textLight">Suit le système</div>
              </div>
            </div>
          </button>
        </div>
      </Section>

      <Section title="Couleur d'accentuation" icon={Palette}>
        <div className="grid grid-cols-3 gap-3">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => updateSetting('accentColor', color.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                settings.accentColor === color.value
                  ? 'border-notion-blue bg-notion-blue/5'
                  : 'border-notion-border hover:border-notion-border/70'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-xs font-medium text-notion-text">{color.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Langue" icon={Globe}>
        <select
          value={settings.language}
          onChange={(e) => updateSetting('language', e.target.value)}
          className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>
      </Section>
    </div>
  );
}

