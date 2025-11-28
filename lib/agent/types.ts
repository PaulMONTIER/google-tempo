import { MessagesAnnotation } from "@langchain/langgraph";

/**
 * Type pour la configuration de l'agent
 */
export interface AgentConfig {
  configurable: {
    userId: string;
  };
}

/**
 * Export de l'annotation d'état pour réutilisation
 */
export type AgentState = typeof MessagesAnnotation.State;

