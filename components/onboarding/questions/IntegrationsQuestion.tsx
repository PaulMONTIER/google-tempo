'use client';

import { ExternalLink } from 'lucide-react';

interface IntegrationsQuestionProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const INTEGRATIONS = [
  {
    id: 'strava',
    name: 'Strava',
    description: 'Synchronise tes activités running, vélo, etc.',
    logo: '🏃',
    available: true,
  },
  {
    id: 'garmin',
    name: 'Garmin',
    description: 'Connecte ta montre Garmin',
    logo: '⌚',
    available: false,
    comingSoon: true,
  },
  {
    id: 'apple_health',
    name: 'Apple Health',
    description: 'Synchronise depuis ton iPhone',
    logo: '🍎',
    available: false,
    comingSoon: true,
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    description: 'Connecte ton tracker Fitbit',
    logo: '💚',
    available: false,
    comingSoon: true,
  },
];

export function IntegrationsQuestion({ selected, onChange }: IntegrationsQuestionProps) {
  const toggleIntegration = (id: string) => {
    const integration = INTEGRATIONS.find(i => i.id === id);
    if (!integration?.available) return;

    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-notion-text">
          Connecte tes apps sport
        </h2>
        <p className="text-notion-textLight">
          Optionnel : synchronise automatiquement tes activités
        </p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => {
          const isSelected = selected.includes(integration.id);
          
          return (
            <button
              key={integration.id}
              onClick={() => toggleIntegration(integration.id)}
              disabled={!integration.available}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-notion-blue bg-notion-blue/5' 
                  : integration.available
                    ? 'border-notion-border hover:border-notion-blue/50 hover:bg-notion-hover'
                    : 'border-notion-border opacity-50 cursor-not-allowed'
                }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{integration.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${isSelected ? 'text-notion-blue' : 'text-notion-text'}`}>
                      {integration.name}
                    </h3>
                    {integration.comingSoon && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-notion-hover text-notion-textLight">
                        Bientôt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-notion-textLight">
                    {integration.description}
                  </p>
                </div>
                {integration.available && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'border-notion-blue bg-notion-blue text-white' 
                      : 'border-notion-border'
                    }`}>
                    {isSelected && <span className="text-sm">✓</span>}
                  </div>
                )}
                {integration.available && isSelected && (
                  <ExternalLink className="w-4 h-4 text-notion-textLight" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-notion-hover">
        <p className="text-sm text-notion-textLight text-center">
          💡 Tu pourras connecter ces services plus tard dans les paramètres.
          <br />
          La connexion se fait via OAuth sécurisé.
        </p>
      </div>

      {selected.length > 0 && (
        <p className="text-center text-sm text-notion-blue font-medium">
          ✓ {selected.length} intégration{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}


