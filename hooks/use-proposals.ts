import { useState, useCallback } from 'react';
import { PendingEvent } from '@/types';
import { EventSemanticType, ProposalOption } from '@/types/proposals';
import { 
  shouldShowProposal, 
  getProposalOptions, 
  buildAgentMessage,
  detectSemanticTypeWithContext
} from '@/lib/proposals/proposal-detector';

/**
 * Type pour les propositions intelligentes (frontend-driven)
 */
export interface ActiveProposal {
  semanticType: EventSemanticType;
  options: ProposalOption[];
  eventTitle: string;
  eventDate: string;
  subject?: string;
  sport?: string;
}

interface UseProposalsOptions {
  sendMessage: (content: string) => Promise<void>;
  lastUserMessage: string;
}

/**
 * Hook pour gérer les propositions intelligentes (Phase 5)
 */
export function useProposals({ sendMessage, lastUserMessage }: UseProposalsOptions) {
  const [activeProposal, setActiveProposal] = useState<ActiveProposal | null>(null);

  /**
   * Vérifie et affiche une proposition après confirmation d'événement
   */
  const checkAndShowProposal = useCallback((event: PendingEvent, isDelete: boolean, isBatchDelete: boolean) => {
    // Ne pas afficher de proposition pour les suppressions
    if (isDelete || isBatchDelete) {
      return;
    }

    const eventTitle = event.title;
    const userMessage = lastUserMessage || '';
    
    console.log('[DEBUG] Proposition check:', { userMessage, eventTitle });
    
    // Utiliser la détection avec contexte (message + titre)
    const semanticType = detectSemanticTypeWithContext(userMessage, eventTitle);
    
    console.log('[DEBUG] Semantic type detected:', semanticType);
    
    // Afficher une proposition seulement pour les types pertinents
    if (semanticType !== 'simple' && semanticType !== 'meeting') {
      const proposalCheck = shouldShowProposal(
        userMessage || eventTitle,
        `J'ai noté ${eventTitle}`
      );
      
      console.log('[DEBUG] Proposal result:', proposalCheck);
      
      setActiveProposal({
        semanticType,
        options: getProposalOptions(semanticType),
        eventTitle,
        eventDate: event.startDateTime || '',
        subject: proposalCheck.subject,
        sport: proposalCheck.sport,
      });
      console.log('[DEBUG] ActiveProposal set for:', semanticType);
    }
  }, [lastUserMessage]);

  /**
   * Gère la sélection d'une option de proposition
   */
  const selectProposalOption = useCallback(async (option: ProposalOption) => {
    if (!activeProposal) return;
    
    // Si "juste l'événement", on ferme la proposition
    if (option.action === 'just_event') {
      setActiveProposal(null);
      return;
    }
    
    // Construire le message à envoyer à l'agent
    const agentMessage = buildAgentMessage(option, {
      eventTitle: activeProposal.eventTitle,
      eventDate: activeProposal.eventDate,
      subject: activeProposal.subject,
      sport: activeProposal.sport,
    });
    
    // Fermer la proposition
    setActiveProposal(null);
    
    // Envoyer le message à l'agent si nécessaire
    if (agentMessage) {
      await sendMessage(agentMessage);
    }
  }, [activeProposal, sendMessage]);

  /**
   * Ferme la proposition sans action
   */
  const dismissProposal = useCallback(() => {
    setActiveProposal(null);
  }, []);

  /**
   * Clear la proposition (pour reset)
   */
  const clearProposal = useCallback(() => {
    setActiveProposal(null);
  }, []);

  return {
    activeProposal,
    setActiveProposal,
    checkAndShowProposal,
    selectProposalOption,
    dismissProposal,
    clearProposal,
  };
}

