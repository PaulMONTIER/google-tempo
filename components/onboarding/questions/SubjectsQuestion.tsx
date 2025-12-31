'use client';

import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface SubjectsQuestionProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const SUGGESTIONS = [
  'Mathématiques', 'Physique', 'Chimie', 'Informatique', 'Biologie',
  'Droit', 'Économie', 'Gestion', 'Marketing', 'Finance',
  'Langues', 'Histoire', 'Philosophie', 'Littérature', 'Médecine',
];

export function SubjectsQuestion({ selected, onChange }: SubjectsQuestionProps) {
  const [inputValue, setInputValue] = useState('');

  const addSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setInputValue('');
  };

  const removeSubject = (subject: string) => {
    onChange(selected.filter(s => s !== subject));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addSubject(inputValue);
    }
  };

  const filteredSuggestions = SUGGESTIONS.filter(
    s => !selected.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-notion-text">
          Quelles matières étudies-tu ?
        </h2>
        <p className="text-notion-textLight">
          Ajoute les matières pour lesquelles tu veux organiser tes révisions
        </p>
      </div>

      {/* Tags sélectionnés */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((subject) => (
            <span
              key={subject}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full 
                       bg-notion-blue/10 text-notion-blue text-sm font-medium"
            >
              {subject}
              <button
                onClick={() => removeSubject(subject)}
                className="p-0.5 hover:bg-notion-blue/20 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tape une matière et appuie sur Entrée..."
          className="w-full px-4 py-3 rounded-xl border border-notion-border 
                   bg-notion-bg text-notion-text placeholder:text-notion-textLight
                   focus:outline-none focus:ring-2 focus:ring-notion-blue focus:border-transparent"
        />
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        <p className="text-sm text-notion-textLight">Suggestions :</p>
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addSubject(suggestion)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full 
                       border border-notion-border text-sm text-notion-text
                       hover:border-notion-blue hover:bg-notion-blue/5 transition-all"
            >
              <Plus className="w-3 h-3" />
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-center text-sm text-notion-textLight">
          {selected.length} matière{selected.length > 1 ? 's' : ''} ajoutée{selected.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}


