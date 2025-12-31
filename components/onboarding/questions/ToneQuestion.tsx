'use client';

import { Heart, Flame, Zap } from 'lucide-react';

interface ToneQuestionProps {
  selected: 'supportive' | 'pepTalk' | 'lightTrashTalk';
  onChange: (selected: 'supportive' | 'pepTalk' | 'lightTrashTalk') => void;
}

const TONES = [
  {
    id: 'supportive' as const,
    label: 'Bienveillant',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500',
    example: 'Super journée en vue ! Tu as 3 révisions prévues, tu vas gérer 💪',
  },
  {
    id: 'pepTalk' as const,
    label: 'Pep Talk',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    example: 'Allez champion ! C\'est le moment de tout donner sur ces révisions ! 🔥',
  },
  {
    id: 'lightTrashTalk' as const,
    label: 'Trash-talk léger',
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
    example: '3 révisions aujourd\'hui ? Facile pour quelqu\'un de ton calibre... non ? 😏',
  },
];

export function ToneQuestion({ selected, onChange }: ToneQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-notion-text">
          Quel ton préfères-tu ?
        </h2>
        <p className="text-notion-textLight">
          Choisis le style de communication de Tempo
        </p>
      </div>

      <div className="space-y-4">
        {TONES.map((tone) => {
          const isSelected = selected === tone.id;
          const Icon = tone.icon;
          
          return (
            <button
              key={tone.id}
              onClick={() => onChange(tone.id)}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-notion-blue bg-notion-blue/5 shadow-md' 
                  : 'border-notion-border hover:border-notion-blue/50 hover:bg-notion-hover'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isSelected ? tone.bgColor : 'bg-notion-hover'}`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : tone.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-semibold ${isSelected ? 'text-notion-blue' : 'text-notion-text'}`}>
                      {tone.label}
                    </h3>
                    {isSelected && (
                      <span className="text-notion-blue">✓</span>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-notion-sidebar">
                    <p className="text-sm text-notion-textLight italic">
                      &quot;{tone.example}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-notion-textLight">
        Tu pourras changer le ton à tout moment dans les paramètres
      </p>
    </div>
  );
}


