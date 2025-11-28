'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { X, User, Bell, Moon, Sun, Palette, Globe, Shield, Mail, Calendar, Eye, LogOut } from '@/components/icons';
import { useSettings, UserSettings } from '@/components/providers/settings-provider';

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
    setTimeout(onClose, 300);
  };

  const handleUpdateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    updateSetting(key, value);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`w-full max-w-3xl max-h-[85vh] bg-notion-bg rounded-xl shadow-2xl pointer-events-auto transition-all duration-300 ease-out flex flex-col ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
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
              {activeTab === 'account' && <AccountSettings userInfo={userInfo} />}
              {activeTab === 'notifications' && <NotificationSettings settings={settings} updateSetting={handleUpdateSetting} />}
              {activeTab === 'appearance' && <AppearanceSettings settings={settings} updateSetting={handleUpdateSetting} />}
              {activeTab === 'calendar' && <CalendarSettings settings={settings} updateSetting={handleUpdateSetting} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Account Settings Tab
function AccountSettings({
  userInfo,
}: {
  userInfo: { name: string; email: string; avatar: string };
}) {
  return (
    <div className="space-y-6">
      <Section title="Informations personnelles" icon={User}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-notion-orange to-notion-yellow rounded-full flex items-center justify-center font-bold text-white text-2xl">
            {userInfo.avatar}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-notion-text">
              {userInfo.name}
            </p>
            <p className="text-xs text-notion-textLight mt-1">
              Connecté via Google
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-notion-text mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={userInfo.name}
              disabled
              className="w-full px-3 py-2 border border-notion-border rounded-lg bg-notion-sidebar text-notion-textLight cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={userInfo.email}
              disabled
              className="w-full px-3 py-2 border border-notion-border rounded-lg bg-notion-sidebar text-notion-textLight cursor-not-allowed"
            />
          </div>
        </div>
      </Section>

      <Section title="Sécurité" icon={Shield}>
        <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-notion-text hover:bg-notion-hover rounded-lg transition-colors border border-notion-border">
          Changer le mot de passe
        </button>
        <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-notion-text hover:bg-notion-hover rounded-lg transition-colors border border-notion-border mt-3">
          Activer l'authentification à deux facteurs
        </button>
      </Section>

      <Section title="Session" icon={LogOut}>
        <button
          onClick={() => signOut()}
          className="w-full px-4 py-2.5 text-left text-sm font-medium text-notion-textLight hover:bg-notion-hover rounded-lg transition-colors border border-notion-border flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </Section>
    </div>
  );
}

// Notification Settings Tab
function NotificationSettings({
  settings,
  updateSetting,
}: {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
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

// Appearance Settings Tab
function AppearanceSettings({
  settings,
  updateSetting,
}: {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
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
            onClick={() => updateSetting('theme', 'auto')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
              settings.theme === 'auto'
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

// Calendar Settings Tab
function CalendarSettings({
  settings,
  updateSetting,
}: {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
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
              onChange={(e) => updateSetting('weekStartsOn', Number(e.target.value))}
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
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  settings.timeFormat === '12h'
                    ? 'border-notion-blue bg-notion-blue/5 text-notion-text'
                    : 'border-notion-border text-notion-textLight hover:border-notion-blue/50'
                }`}
              >
                12h (AM/PM)
              </button>
              <button
                onClick={() => updateSetting('timeFormat', '24h')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  settings.timeFormat === '24h'
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
    </div>
  );
}

// Reusable Components
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-notion-textLight" />
        <h3 className="text-base font-semibold text-notion-text">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-notion-hover transition-colors">
      <div className="flex-1">
        <div className="font-medium text-notion-text text-sm">{label}</div>
        <div className="text-xs text-notion-textLight mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-notion-blue' : 'bg-notion-border'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
