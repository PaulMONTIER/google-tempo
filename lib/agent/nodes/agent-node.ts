import { SystemMessage } from "@langchain/core/messages";
import type { MessagesAnnotation } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";
import { createModel } from "../config/model-config";
import { SYSTEM_PROMPT_TEMPLATE } from "../prompts/system-prompt";
import { formatCurrentDate, formatCurrentTime, buildDynamicSystemPrompt } from "../utils/date-formatters";
import { logger } from "@/lib/utils/logger";
import { Rule } from "@/types";

/**
 * Construit la section des règles utilisateur pour le prompt
 */
function buildRulesSection(rules: Rule[]): string {
  if (!rules || rules.length === 0) {
    return "";
  }

  const rulesText = rules
    .map((r, i) => `${i + 1}. **${r.name}** : ${r.description}`)
    .join("\n");

  return `

---

## RÈGLES UTILISATEUR ACTIVES :
Tu dois TOUJOURS respecter ces règles lors de la création/modification d'événements :
${rulesText}

`;
}

/**
 * Noeud de l'agent : appelle le modèle LLM avec le prompt système dynamique
 * @param state État du graphe contenant les messages
 * @param config Configuration du runtime (userId, rules, etc.)
 * @returns Nouvel état avec la réponse du modèle
 */
export async function callModel(
  state: typeof MessagesAnnotation.State,
  config?: RunnableConfig
) {
  const { messages = [] } = state || {};

  // Protection contre les messages undefined
  if (!messages || !Array.isArray(messages)) {
    logger.error('[AGENT NODE] Messages invalides:', messages);
    throw new Error('Messages invalides ou manquants dans le state');
  }

  const model = createModel();

  // A. Calcul du temps présent
  const currentDate = formatCurrentDate();
  const currentTime = formatCurrentTime();

  // B. Construction du Prompt Système Dynamique
  let dynamicSystemPrompt = buildDynamicSystemPrompt(
    SYSTEM_PROMPT_TEMPLATE,
    currentDate,
    currentTime
  );

  // 🆕 C. Injection des règles utilisateur
  const rules: Rule[] = config?.configurable?.rules || [];
  if (rules.length > 0) {
    dynamicSystemPrompt += buildRulesSection(rules);
    logger.debug(`📋 [AGENT NODE] ${rules.length} règle(s) utilisateur injectée(s) dans le prompt`);
  }

  // D. Fusion : System Prompt + Historique de conversation
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

  try {
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
  } catch (error: any) {
    logger.error(`❌ [AGENT NODE] Erreur lors de l'appel au modèle:`, error);

    // En cas d'erreur (timeout, etc.), on retourne un message d'erreur à l'utilisateur
    // au lieu de faire planter toute l'application
    return {
      messages: [{
        role: 'assistant',
        content: "Désolé, je n'ai pas réussi à traiter votre demande complexe dans le temps imparti. Pouvez-vous essayer de la reformuler en plusieurs étapes plus simples ? (ex: 'Trouve des créneaux' puis 'Crée l'événement')",
        id: Date.now().toString(),
      }]
    };
  }
}

