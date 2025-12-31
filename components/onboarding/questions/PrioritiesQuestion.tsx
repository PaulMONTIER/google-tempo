'use client';

import { GraduationCap, Dumbbell, Briefcase, Heart } from 'lucide-react';

interface PrioritiesQuestionProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const PRIORITIES = [
  { id: 'studies', label: 'Études', icon: GraduationCap, description: 'Cours, révisions, examens' },
  { id: 'sport', label: 'Sport', icon: Dumbbell, description: 'Entraînements, compétitions' },
  { id: 'pro', label: 'Professionnel', icon: Briefcase, description: 'Stage, travail, projets' },
  { id: 'personal', label: 'Personnel', icon: Heart, description: 'Loisirs, bien-être' },
];

export function PrioritiesQuestion({ selected, onChange }: PrioritiesQuestionProps) {
  const togglePriority = (id: string) => {
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
          Quelles sont tes activités prioritaires ?
        </h2>
        <p className="text-notion-textLight">
          Sélectionne jusqu&apos;à 3 domaines que tu veux suivre avec Tempo
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PRIORITIES.map((priority) => {
          const isSelected = selected.includes(priority.id);
          const Icon = priority.icon;
          
          return (
            <button
              key={priority.id}
              onClick={() => togglePriority(priority.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-notion-blue bg-notion-blue/5 shadow-md' 
                  : 'border-notion-border hover:border-notion-blue/50 hover:bg-notion-hover'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                ${isSelected ? 'bg-notion-blue text-white' : 'bg-notion-hover text-notion-textLight'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className={`font-semibold mb-1 ${isSelected ? 'text-notion-blue' : 'text-notion-text'}`}>
                {priority.label}
              </h3>
              <p className="text-sm text-notion-textLight">
                {priority.description}
              </p>
              {isSelected && (
                <div className="mt-3 flex items-center gap-1 text-notion-blue text-sm font-medium">
                  <span>✓</span>
                  <span>Sélectionné</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-center text-sm text-notion-textLight">
          {selected.length}/3 sélectionné{selected.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}


