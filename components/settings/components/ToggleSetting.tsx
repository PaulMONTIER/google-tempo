interface ToggleSettingProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Composant Toggle réutilisable pour les paramètres
 */
export function ToggleSetting({ label, description, enabled, onChange }: ToggleSettingProps) {
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

