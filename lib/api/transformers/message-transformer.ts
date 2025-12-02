import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Transforme les messages du format frontend vers le format LangChain
 * @param messages - Messages au format frontend (role + content)
 * @returns Messages au format LangChain (HumanMessage/AIMessage)
 */
export function transformMessagesToLangChain(
  messages: ChatMessage[]
): BaseMessage[] {
  return messages
    .map((msg) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      }
      if (msg.role === "assistant") {
        return new AIMessage(msg.content);
      }
      return null;
    })
    .filter((msg): msg is BaseMessage => msg !== null);
}

