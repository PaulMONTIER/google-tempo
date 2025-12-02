import type { BaseMessage } from "@langchain/core/messages";

/**
 * Type d'action détectée depuis les tool calls
 */
export type DetectedAction = "create" | "delete" | "search" | "none";

/**
 * Détecte l'action effectuée par l'agent en analysant les tool calls dans les messages
 * @param messages - Messages retournés par l'agent LangGraph
 * @returns Type d'action détectée
 */
export function detectActionFromMessages(
  messages: BaseMessage[]
): DetectedAction {
  const toolMessages = messages.filter(
    (msg: any) => msg.tool_calls?.length > 0
  );

  if (toolMessages.length === 0) {
    return "none";
  }

  const lastToolMessage = toolMessages[toolMessages.length - 1];
  const toolCalls = (lastToolMessage as any).tool_calls || [];

  if (toolCalls.some((tc: any) => tc.name === "create_calendar_event")) {
    return "create";
  }

  if (toolCalls.some((tc: any) => tc.name === "delete_calendar_event")) {
    return "delete";
  }

  if (toolCalls.some((tc: any) => tc.name === "find_free_slots")) {
    return "search";
  }

  return "none";
}

