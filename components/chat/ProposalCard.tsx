'use client';

import { Loader2, Sparkles, Calendar, BookOpen, Trophy, Clock, Dumbbell, X } from 'lucide-react';
import { EventSemanticType, ProposalOption } from '@/types/proposals';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActiveProposal {
  semanticType: EventSemanticType;
  options: ProposalOption[];
  eventTitle: string;
  eventDate: string;
  subject?: string;
  sport?: string;
}

interface ProposalCardProps {
  proposal: ActiveProposal;
  onSelectOption: (option: ProposalOption) => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

// Configuration par type d'événement
const PROPOSAL_CONFIG: Record<EventSemanticType, {
  question: string;
  icon: React.ReactNode;
  gradient: string;
  buttonText: string;
}> = {
  exam: {
    question: 'Veux-tu un programme de révision ?',
    icon: <BookOpen className="w-5 h-5" />,
    gradient: 'from-blue-500/20 to-indigo-500/20',
    buttonText: 'Créer le programme',
  },
  competition: {
    question: 'Veux-tu un programme d\'entraînement ?',
    icon: <Trophy className="w-5 h-5" />,
    gradient: 'from-green-500/20 to-emerald-500/20',
    buttonText: 'Créer le programme',
  },
  deadline: {
    question: 'Je te bloque du temps de préparation ?',
    icon: <Clock className="w-5 h-5" />,
    gradient: 'from-orange-500/20 to-amber-500/20',
    buttonText: 'Bloquer du temps',
  },
  study: {
    question: 'Veux-tu des ressources pour réviser ?',
    icon: <BookOpen className="w-5 h-5" />,
    gradient: 'from-purple-500/20 to-violet-500/20',
    buttonText: 'Voir les ressources',
  },
  training: {
    question: 'Tu veux rendre cet entraînement récurrent ?',
    icon: <Dumbbell className="w-5 h-5" />,
    gradient: 'from-red-500/20 to-rose-500/20',
    buttonText: 'Rendre récurrent',
  },
  meeting: { question: '', icon: null, gradient: '', buttonText: '' },
  simple: { question: '', icon: null, gradient: '', buttonText: '' },
};

export function ProposalCard({
  proposal,
  onSelectOption,
  onDismiss,
  isLoading = false,
}: ProposalCardProps) {
  const config = PROPOSAL_CONFIG[proposal.semanticType];
  
  // Ne pas afficher si pas de question pertinente
  if (!config.question) return null;

  // Trouver les options
  const yesOption = proposal.options.find(o => o.action !== 'just_event');
  const noOption = proposal.options.find(o => o.action === 'just_event');

  // Formater la date si disponible
  const formattedDate = proposal.eventDate ? (() => {
    try {
      const date = parseISO(proposal.eventDate);
      return format(date, 'd MMMM', { locale: fr });
    } catch {
      return '';
    }
  })() : '';

  return (
    <div className={`
      w-full max-w-sm rounded-xl border border-notion-border shadow-lg overflow-hidden 
      bg-gradient-to-br ${config.gradient} backdrop-blur-sm
      animate-in slide-in-from-bottom-2 duration-300
    `}>
      {/* Header avec icône et fermer */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 text-notion-blue">
          {config.icon}
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-notion-hover transition-colors"
          >
            <X className="w-4 h-4 text-notion-textLight" />
          </button>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Événement concerné */}
        <div className="mb-3">
          <p className="text-xs text-notion-textLight flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {proposal.eventTitle}
            {formattedDate && ` • ${formattedDate}`}
          </p>
        </div>

        {/* Question */}
        <p className="text-sm font-medium text-notion-text mb-4">
          {config.question}
        </p>

        {/* Boutons */}
        <div className="flex gap-2">
          {yesOption && (
            <button
              onClick={() => onSelectOption(yesOption)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
                       bg-notion-blue text-white hover:bg-notion-blue/90
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 hover:shadow-md
                       flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {config.buttonText}
                </>
              )}
            </button>
          )}
          {noOption && (
            <button
              onClick={() => onSelectOption(noOption)}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg font-medium text-sm
                       bg-notion-bg/80 text-notion-textLight border border-notion-border
                       hover:bg-notion-hover hover:text-notion-text
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              Non
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

