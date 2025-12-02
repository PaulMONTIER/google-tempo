import { END } from "@langchain/langgraph";
import type { MessagesAnnotation } from "@langchain/langgraph";

/**
 * Détermine si l'agent doit continuer (appeler des outils) ou s'arrêter
 * @param state État du graphe contenant les messages
 * @returns "tools" si des outils doivent être appelés, END sinon
 */
export function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | typeof END {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // Si le LLM a décidé d'appeler un outil (il a généré un tool_call)
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  // Sinon, il a généré du texte final, on s'arrête.
  return END;
}

