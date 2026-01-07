'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface SoftSkillsQuestionProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const SOFT_SKILLS = [
  {
    id: 'punctuality',
    label: 'Ponctualité',
    icon: '⏰',
    definition: 'Respecter les horaires et délais fixés pour tes activités'
  },
  {
    id: 'perseverance',
    label: 'Persévérance',
    icon: '🏔️',
    definition: 'Maintenir tes efforts malgré les difficultés rencontrées'
  },
  {
    id: 'rigor',
    label: 'Rigueur',
    icon: '📐',
    definition: 'Être précis et méthodique dans ton travail quotidien'
  },
  {
    id: 'autonomy',
    label: 'Autonomie',
    icon: '🦅',
    definition: 'Travailler de manière indépendante sans supervision constante'
  },
  {
    id: 'adaptability',
    label: 'Adaptabilité',
    icon: '🌊',
    definition: "T'ajuster aux changements et imprévus avec flexibilité"
  },
  {
    id: 'organization',
    label: 'Organisation',
    icon: '📋',
    definition: 'Structurer ton travail et ton temps efficacement'
  },
  {
    id: 'teamwork',
    label: 'Travail en équipe',
    icon: '🤝',
    definition: 'Collaborer efficacement avec les autres'
  },
  {
    id: 'stress_management',
    label: 'Gestion du stress',
    icon: '🧘',
    definition: 'Rester calme et efficace sous pression'
  },
];

export function SoftSkillsQuestion({ selected, onChange }: SoftSkillsQuestionProps) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  const toggleSkill = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else if (selected.length < 3) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-notion-text">
          Quels savoirs-être veux-tu développer ?
        </h2>
        <p className="text-notion-textLight">
          Choisis exactement 3 compétences comportementales à suivre
        </p>
      </div>

      {/* Info bulle pour le skill survolé - hauteur fixe pour éviter le saut */}
      <div className="h-20 mb-2">
        {hoveredSkill ? (
          <div className="p-4 rounded-xl bg-notion-blue/5 border border-notion-blue/20">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-notion-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-notion-text">
                  {SOFT_SKILLS.find(s => s.id === hoveredSkill)?.label}
                </p>
                <p className="text-sm text-notion-textLight">
                  {SOFT_SKILLS.find(s => s.id === hoveredSkill)?.definition}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-notion-sidebar/30 border border-transparent">
            <p className="text-sm text-notion-textLight text-center">
              Survole un savoir-être pour voir sa définition
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SOFT_SKILLS.map((skill) => {
          const isSelected = selected.includes(skill.id);
          const isDisabled = selected.length >= 3 && !isSelected;

          return (
            <button
              key={skill.id}
              onClick={() => !isDisabled && toggleSkill(skill.id)}
              onMouseEnter={() => setHoveredSkill(skill.id)}
              onMouseLeave={() => setHoveredSkill(null)}
              disabled={isDisabled}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected
                  ? 'border-notion-blue bg-notion-blue/5'
                  : isDisabled
                    ? 'border-notion-border opacity-40 cursor-not-allowed'
                    : 'border-notion-border hover:border-notion-blue/50 hover:bg-notion-hover'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{skill.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isSelected ? 'text-notion-blue' : 'text-notion-text'}`}>
                    {skill.label}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-notion-blue text-lg">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${selected.length >= num
                ? 'bg-notion-blue text-white'
                : 'bg-notion-hover text-notion-textLight'
              }`}
          >
            {num}
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-notion-textLight">
        {selected.length}/3 sélectionné{selected.length > 1 ? 's' : ''}
        {selected.length === 3 && ' ✓'}
      </p>
    </div>
  );
}


