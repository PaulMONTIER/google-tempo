import { SystemMessage } from "@langchain/core/messages";
import type { MessagesAnnotation } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";
import { createModel } from "../config/model-config";
import { SYSTEM_PROMPT_TEMPLATE } from "../prompts/system-prompt";
import { formatCurrentDate, formatCurrentTime, buildDynamicSystemPrompt } from "../utils/date-formatters";
import { logger } from "@/lib/utils/logger";
import { Rule } from "@/types";
import { apiKeyRotator, isQuotaExceededError } from "@/lib/ai/model-factory";

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
 * Implémente une rotation automatique des clés API en cas de quota dépassé
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

  // A. Calcul du temps présent
  const currentDate = formatCurrentDate();
  const currentTime = formatCurrentTime();

  // B. Construction du Prompt Système Dynamique
  let dynamicSystemPrompt = buildDynamicSystemPrompt(
    SYSTEM_PROMPT_TEMPLATE,
    currentDate,
    currentTime
  );

  // C. Injection des règles utilisateur
  const rules: Rule[] = config?.configurable?.rules || [];
  if (rules.length > 0) {
    dynamicSystemPrompt += buildRulesSection(rules);
    logger.debug(`📋 [AGENT NODE] ${rules.length} règle(s) utilisateur injectée(s) dans le prompt`);
  }

  // D. Fusion : System Prompt + Historique de conversation
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

  // E. Appel au modèle avec retry et rotation de clés
  const maxAttempts = apiKeyRotator.getTotalKeys();
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug(`[AGENT NODE] Tentative ${attempt}/${maxAttempts} avec clé ${apiKeyRotator.getCurrentIndex() + 1}`);

      const model = createModel();
      const result = await model.invoke([
        new SystemMessage(dynamicSystemPrompt),
        ...messages
      ]);

      // Succès ! Log et retour
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
      lastError = error;

      // Vérifier si c'est une erreur de quota
      if (isQuotaExceededError(error)) {
        logger.warn(`⚠️ [AGENT NODE] Quota dépassé sur clé ${apiKeyRotator.getCurrentIndex() + 1}, tentative de rotation...`);

        const rotated = apiKeyRotator.markCurrentKeyFailedAndRotate();
        if (rotated && attempt < maxAttempts) {
          logger.info(`🔄 [AGENT NODE] Rotation vers clé ${apiKeyRotator.getCurrentIndex() + 1}, nouvel essai...`);
          continue; // Réessayer avec la nouvelle clé
        } else {
          logger.error(`❌ [AGENT NODE] Toutes les clés API ont atteint leur quota !`);
          break;
        }
      } else {
        // Autre type d'erreur, pas de retry
        logger.error(`❌ [AGENT NODE] Erreur lors de l'appel au modèle:`);
        logger.error(`   Type: ${error?.name || error?.constructor?.name || 'Unknown'}`);
        logger.error(`   Message: ${error?.message || 'No message'}`);
        break;
      }
    }
  }

  // Si on arrive ici, toutes les tentatives ont échoué
  logger.error(`❌ [AGENT NODE] Échec après ${maxAttempts} tentative(s)`);
  if (lastError?.stack) {
    logger.error(`   Stack: ${lastError.stack.split('\n').slice(0, 3).join('\n')}`);
  }

  // Réinitialiser les clés après un délai (pour les prochaines requêtes)
  setTimeout(() => {
    apiKeyRotator.resetFailedKeys();
    logger.info('[AGENT NODE] Clés API réinitialisées pour les prochaines requêtes');
  }, 60000); // Reset après 1 minute

  // Retourner un message d'erreur utilisateur-friendly
  const isQuotaError = isQuotaExceededError(lastError);
  const userMessage = isQuotaError
    ? '⚠️ Quota API dépassé sur toutes les clés. Veuillez réessayer dans quelques minutes.'
    : `Désolé, une erreur s'est produite : ${lastError?.message || 'erreur inconnue'}. Pouvez-vous réessayer ?`;

  return {
    messages: [{
      role: 'assistant',
      content: userMessage,
      id: Date.now().toString(),
    }]
  };
}

