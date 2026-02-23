import { END } from "@langchain/langgraph";
import type { MessagesAnnotation } from "@langchain/langgraph";

/**
 * Détermine si l'agent doit continuer (appeler des outils) ou s'arrêter
 * @param state État du graphe contenant les messages
 * @returns "tools" si des outils doivent être appelés, END sinon
 */
export function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | typeof END {
  const lastMessage = Array.isArray(state.messages) ? state.messages[state.messages.length - 1] as any : null;

  // Si le message demande un appel d'outil, on va vers 'tools'
  if (lastMessage?.tool_calls?.length) {
    return "tools";
  }

  // Sinon, il a généré du texte final, on s'arrête.
  return END;
}

