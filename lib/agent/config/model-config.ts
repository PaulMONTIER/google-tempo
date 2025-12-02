import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { createGeminiModelWithTools } from "@/lib/ai/model-factory";

/**
 * Liste des outils disponibles pour l'agent
 * Initialisation lazy pour éviter les cycles d'imports
 * Protection contre la réentrance : évite la création de multiples instances
 */
let _tools: StructuredToolInterface[] | null = null;
let _isInitializingTools = false;

function getTools(): StructuredToolInterface[] {
  // Retour immédiat si déjà initialisé
  if (_tools) {
    return _tools;
  }
  
  // Protection contre la réentrance (défensive, Node.js est single-threaded)
  if (_isInitializingTools) {
    throw new Error("Tools are being initialized");
  }
  
  _isInitializingTools = true;
  try {
    // Import dynamique pour éviter les cycles au build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const toolsModule = require("../tools/calendar");
    _tools = [
      toolsModule.findFreeSlotsTool,
      toolsModule.createEventTool,
      toolsModule.addMeetToEventTool,
      toolsModule.getEventsTool,
      toolsModule.deleteEventTool,
    ];
    return _tools;
  } finally {
    _isInitializingTools = false;
  }
}

/**
 * Noeud d'exécution des outils (initialisation lazy)
 */
let _toolNode: ToolNode | null = null;
let _isInitializingToolNode = false;

export function getToolNode(): ToolNode {
  // Retour immédiat si déjà initialisé
  if (_toolNode) {
    return _toolNode;
  }
  
  // Protection contre la réentrance (défensive)
  if (_isInitializingToolNode) {
    throw new Error("Tool node is being initialized");
  }
  
  _isInitializingToolNode = true;
  try {
    _toolNode = new ToolNode(getTools());
    return _toolNode;
  } finally {
    _isInitializingToolNode = false;
  }
}

/**
 * Crée et configure le modèle Gemini avec les outils
 * @returns Modèle Gemini configuré avec outils liés
 */
export function createModel() {
  return createGeminiModelWithTools(getTools());
}

