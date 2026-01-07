'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EventSemanticType, PROPOSAL_CONFIG, ProposalOption } from '@/types/proposals';

interface EventProposalCardProps {
  semanticType: EventSemanticType;
  eventTitle: string;
  eventDate: string;
  message: string;
  onSelectOption: (option: ProposalOption) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Carte de proposition intelligente affichée dans le chat
 * Permet à l'utilisateur de choisir une action après la création d'un événement
 */
export function EventProposalCard({
  semanticType,
  eventTitle,
  eventDate,
  message,
  onSelectOption,
  isLoading = false,
}: EventProposalCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const config = PROPOSAL_CONFIG[semanticType];
  
  // Génère les options avec des IDs uniques
  const options: ProposalOption[] = config.defaultOptions.map((opt, index) => ({
    ...opt,
    id: `${semanticType}-${index}`,
  }));

  const handleSelect = async (option: ProposalOption) => {
    if (isLoading) return;
    setSelectedId(option.id);
    await onSelectOption(option);
  };

  // Icône selon le type
  const typeIcons: Record<EventSemanticType, string> = {
    exam: '🎓',
    competition: '🏆',
    deadline: '💼',
    study: '📖',
    training: '💪',
    meeting: '📅',
    simple: '📅',
  };

  // Couleurs selon le type
  const typeColors: Record<EventSemanticType, string> = {
    exam: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    competition: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    deadline: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
    study: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
    training: 'from-red-500/20 to-rose-500/20 border-red-500/30',
    meeting: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
    simple: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
  };

  return (
    <div className={`
      w-full max-w-md rounded-xl border p-4
      bg-gradient-to-br ${typeColors[semanticType]}
      backdrop-blur-sm
    `}>
      {/* Header avec icône */}
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">{typeIcons[semanticType]}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-notion-text text-sm">
            {eventTitle}
          </h3>
          <p className="text-xs text-notion-textLight mt-0.5">
            {eventDate}
          </p>
        </div>
      </div>

      {/* Message de Tempo */}
      <p className="text-sm text-notion-text mb-4 whitespace-pre-wrap">
        {message}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            disabled={isLoading}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-left text-sm font-medium
              transition-all duration-200
              ${selectedId === option.id
                ? 'bg-notion-blue text-white shadow-md'
                : 'bg-white/50 dark:bg-gray-800/50 text-notion-text hover:bg-white/80 dark:hover:bg-gray-800/80'
              }
              ${isLoading && selectedId !== option.id ? 'opacity-50 cursor-not-allowed' : ''}
              border border-transparent hover:border-notion-border
            `}
          >
            <span className="text-lg">{option.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{option.label}</div>
              {option.description && (
                <div className="text-xs opacity-70 mt-0.5">
                  {option.description}
                </div>
              )}
            </div>
            {isLoading && selectedId === option.id && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Parse le JSON de proposition depuis la réponse de l'agent
 */
export function parseProposalFromResponse(response: string): {
  cleanMessage: string;
  proposal: { type: string; semanticType: EventSemanticType; options: string[] } | null;
} {
  // Cherche le bloc JSON dans la réponse
  const jsonMatch = response.match(/```json\s*({[\s\S]*?})\s*```/);
  
  if (!jsonMatch) {
    return { cleanMessage: response, proposal: null };
  }

  try {
    const proposal = JSON.parse(jsonMatch[1]);
    
    // Vérifie que c'est bien une proposition
    if (proposal.type !== 'proposal') {
      return { cleanMessage: response, proposal: null };
    }

    // Retire le bloc JSON du message
    const cleanMessage = response.replace(/```json[\s\S]*?```/g, '').trim();

    return {
      cleanMessage,
      proposal: {
        type: proposal.type,
        semanticType: proposal.semanticType as EventSemanticType,
        options: proposal.options,
      },
    };
  } catch {
    return { cleanMessage: response, proposal: null };
  }
}

/**
 * Extrait le titre et la date depuis le message de Tempo
 */
export function extractEventInfoFromMessage(message: string): {
  title: string;
  date: string;
} {
  // Patterns pour extraire les infos
  const titlePatterns = [
    /(?:noté|créé|ajouté)\s+(?:ton|ta|le|la|un|une)\s+(.+?)\s+(?:le|pour|à)/i,
    /(?:ton|ta)\s+(.+?)\s+(?:est|le)/i,
  ];

  const datePatterns = [
    /le\s+(\d{1,2}(?:er)?\s+\w+(?:\s+\d{4})?)/i,
    /pour\s+le\s+(\d{1,2}(?:er)?\s+\w+)/i,
    /(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/,
  ];

  let title = 'Événement';
  let date = '';

  for (const pattern of titlePatterns) {
    const match = message.match(pattern);
    if (match) {
      title = match[1].trim();
      break;
    }
  }

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      date = match[1].trim();
      break;
    }
  }

  return { title, date };
}

