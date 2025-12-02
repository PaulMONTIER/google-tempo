/**
 * @deprecated Ce fichier est maintenu pour compatibilité.
 * Le code a été refactorisé dans des modules séparés :
 * - lib/agent/config/model-config.ts : Configuration du modèle
 * - lib/agent/prompts/system-prompt.ts : Prompt système
 * - lib/agent/utils/date-formatters.ts : Formatage dates
 * - lib/agent/nodes/agent-node.ts : Noeud agent
 * - lib/agent/nodes/routing-logic.ts : Logique de routing
 * - lib/agent/graph-builder.ts : Construction du graphe
 * 
 * Utiliser directement : import { agentExecutor } from "@/lib/agent/graph-builder"
 */
export { buildAgentGraph as buildAgentGraph } from "./graph-builder";

// Export pour compatibilité avec le code existant
// INITIALISATION LAZY pour éviter les cycles d'imports
// Import type uniquement pour éviter les effets top-level
import type { buildAgentGraph } from "./graph-builder";

let _agentExecutor: ReturnType<typeof import("./graph-builder").buildAgentGraph> | null = null;
let _isInitializing = false;

/**
 * Obtient l'agent executor (créé de manière lazy pour éviter les cycles)
 * Protection contre la réentrance : évite la création de multiples instances
 */
export function getAgentExecutor() {
  // Retour immédiat si déjà initialisé
  if (_agentExecutor) {
    return _agentExecutor;
  }
  
  // Protection contre la réentrance (défensive, Node.js est single-threaded)
  if (_isInitializing) {
    throw new Error("Agent executor is being initialized");
  }
  
  _isInitializing = true;
  try {
    // Import dynamique pour éviter les cycles au build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { buildAgentGraph } = require("./graph-builder");
    _agentExecutor = buildAgentGraph();
    return _agentExecutor;
  } finally {
    _isInitializing = false;
  }
}

