'use client';

import { useState } from 'react';

interface SportQuestionProps {
  selected: string | null;
  onChange: (selected: string | null) => void;
}

const SPORTS = [
  { id: 'running', label: 'Course à pied', emoji: '🏃' },
  { id: 'gym', label: 'Musculation', emoji: '🏋️' },
  { id: 'swimming', label: 'Natation', emoji: '🏊' },
  { id: 'cycling', label: 'Cyclisme', emoji: '🚴' },
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
];

export function SportQuestion({ selected, onChange }: SportQuestionProps) {
  const [customSport, setCustomSport] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (sportId: string) => {
    if (sportId === 'other') {
      setShowCustom(true);
      onChange(null);
    } else {
      setShowCustom(false);
      onChange(sportId);
    }
  };

  const handleCustomSubmit = () => {
    if (customSport.trim()) {
      onChange(customSport.trim().toLowerCase());
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-notion-text">
          Quel sport pratiques-tu ?
        </h2>
        <p className="text-notion-textLight">
          Sélectionne ton activité sportive principale
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SPORTS.map((sport) => {
          const isSelected = selected === sport.id;
          
          return (
            <button
              key={sport.id}
              onClick={() => handleSelect(sport.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-center
                ${isSelected 
                  ? 'border-notion-blue bg-notion-blue/5 shadow-md' 
                  : 'border-notion-border hover:border-notion-blue/50 hover:bg-notion-hover'
                }`}
            >
              <span className="text-2xl mb-2 block">{sport.emoji}</span>
              <span className={`text-sm font-medium ${isSelected ? 'text-notion-blue' : 'text-notion-text'}`}>
                {sport.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Option Autre */}
      <div className="pt-4 border-t border-notion-border">
        {!showCustom ? (
          <button
            onClick={() => handleSelect('other')}
            className="w-full p-4 rounded-xl border-2 border-dashed border-notion-border 
                     text-notion-textLight hover:border-notion-blue/50 hover:text-notion-text
                     transition-all"
          >
            + Autre sport
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={customSport}
              onChange={(e) => setCustomSport(e.target.value)}
              placeholder="Quel sport pratiques-tu ?"
              className="w-full px-4 py-3 rounded-xl border border-notion-border 
                       bg-notion-bg text-notion-text placeholder:text-notion-textLight
                       focus:outline-none focus:ring-2 focus:ring-notion-blue"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCustom(false);
                  setCustomSport('');
                }}
                className="flex-1 py-2 rounded-lg border border-notion-border text-notion-textLight
                         hover:bg-notion-hover transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={!customSport.trim()}
                className="flex-1 py-2 rounded-lg bg-notion-blue text-white font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Valider
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && !showCustom && (
        <p className="text-center text-sm text-notion-blue font-medium">
          ✓ {SPORTS.find(s => s.id === selected)?.label || selected}
        </p>
      )}
    </div>
  );
}


