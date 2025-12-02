import { SystemMessage } from "@langchain/core/messages";
import type { MessagesAnnotation } from "@langchain/langgraph";
import { createModel } from "../config/model-config";
import { SYSTEM_PROMPT_TEMPLATE } from "../prompts/system-prompt";
import { formatCurrentDate, formatCurrentTime, buildDynamicSystemPrompt } from "../utils/date-formatters";
import { logger } from "@/lib/utils/logger";

/**
 * Noeud de l'agent : appelle le modèle LLM avec le prompt système dynamique
 * @param state État du graphe contenant les messages
 * @returns Nouvel état avec la réponse du modèle
 */
export async function callModel(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const model = createModel();

  // A. Calcul du temps présent
  const currentDate = formatCurrentDate();
  const currentTime = formatCurrentTime();

  // B. Construction du Prompt Système Dynamique
  const dynamicSystemPrompt = buildDynamicSystemPrompt(
    SYSTEM_PROMPT_TEMPLATE,
    currentDate,
    currentTime
  );

  // C. Fusion : System Prompt + Historique de conversation
  // On ajoute le system prompt au début de la liste des messages envoyés à Gemini
  // Note: LangChain gère cela intelligemment sans écraser l'historique visible

  // 🔍 DEBUG: Ce que le LLM reçoit
  logger.debug(`\n🧠 [AGENT NODE] Réflexion en cours...`);
  logger.debug(`📨 [AGENT NODE] Messages entrants (${messages.length} total):`);
  messages.forEach((msg, i) => {
    const type = msg.constructor.name;
    const contentPreview = typeof msg.content === 'string'
      ? msg.content.substring(0, 150).replace(/\n/g, ' ')
      : JSON.stringify(msg.content).substring(0, 150);
    logger.debug(`  [${i}] ${type}: ${contentPreview}${contentPreview.length >= 150 ? '...' : ''}`);
    if ((msg as any).tool_calls?.length) {
      logger.debug(`      ⚙️  Tool calls demandés: ${(msg as any).tool_calls.map((tc: any) => tc.name).join(', ')}`);
    }
  });

  const result = await model.invoke([
    new SystemMessage(dynamicSystemPrompt),
    ...messages
  ]);

  // 🔍 DEBUG: Ce que le LLM répond
  logger.debug(`\n💭 [AGENT NODE] Réponse du LLM:`);
  logger.debug(`   Type: ${result.constructor.name}`);
  const resultContent = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  logger.debug(`   Content: ${resultContent.substring(0, 200)}${resultContent.length > 200 ? '...' : ''}`);
  if (result.tool_calls?.length) {
    logger.debug(`   🛠️  DÉCISION: Appeler les outils → ${result.tool_calls.map((tc: any) => tc.name).join(', ')}`);
  } else {
    logger.debug(`   ✋ DÉCISION: Arrêt (pas d'outil à appeler, réponse finale)`);
  }

  return { messages: [result] };
}

