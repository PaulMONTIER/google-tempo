'use client';

import { Clock } from 'lucide-react';

interface NotificationTimeQuestionProps {
  value: string;
  onChange: (value: string) => void;
}

const PRESET_TIMES = [
  { value: '07:00', label: '7h00', description: 'Lève-tôt' },
  { value: '08:00', label: '8h00', description: 'Classique' },
  { value: '09:00', label: '9h00', description: 'Tranquille' },
  { value: '10:00', label: '10h00', description: 'Grasse mat\'' },
];

export function NotificationTimeQuestion({ value, onChange }: NotificationTimeQuestionProps) {
  const isPreset = PRESET_TIMES.some(t => t.value === value);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-notion-text">
          À quelle heure veux-tu ton message quotidien ?
        </h2>
        <p className="text-notion-textLight">
          Tempo t&apos;envoie un message motivant chaque matin
        </p>
      </div>

      {/* Aperçu du message */}
      <div className="p-4 rounded-xl bg-notion-blue/5 border border-notion-blue/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-notion-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">T</span>
          </div>
          <div>
            <p className="text-sm text-notion-textLight mb-1">
              {value || '08:00'} - Message quotidien
            </p>
            <p className="text-notion-text">
              Bonjour ! Belle journée en vue. Tu as 2 révisions prévues, tu vas gérer 💪
            </p>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRESET_TIMES.map((time) => {
          const isSelected = value === time.value;
          
          return (
            <button
              key={time.value}
              onClick={() => onChange(time.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-center
                ${isSelected 
                  ? 'border-notion-blue bg-notion-blue/5' 
                  : 'border-notion-border hover:border-notion-blue/50 hover:bg-notion-hover'
                }`}
            >
              <Clock className={`w-5 h-5 mx-auto mb-2 ${isSelected ? 'text-notion-blue' : 'text-notion-textLight'}`} />
              <p className={`font-semibold ${isSelected ? 'text-notion-blue' : 'text-notion-text'}`}>
                {time.label}
              </p>
              <p className="text-xs text-notion-textLight">{time.description}</p>
            </button>
          );
        })}
      </div>

      {/* Heure personnalisée */}
      <div className="pt-4 border-t border-notion-border">
        <label className="block text-sm text-notion-textLight mb-2">
          Ou choisis une heure personnalisée :
        </label>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border transition-all
            ${!isPreset && value
              ? 'border-notion-blue bg-notion-blue/5' 
              : 'border-notion-border bg-notion-bg'
            }
            text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue`}
        />
      </div>

      <p className="text-center text-sm text-notion-textLight">
        Tu pourras modifier ce choix dans les paramètres
      </p>
    </div>
  );
}


