import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { callModel } from "./nodes/agent-node";
import { shouldContinue } from "./nodes/routing-logic";
import { getToolNode } from "./config/model-config";

/**
 * Construit et compile le graphe de l'agent LangGraph
 * @returns Exécuteur du graphe compilé
 */
export function buildAgentGraph() {
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", getToolNode())

    // Point d'entrée -> L'agent réfléchit
    .addEdge(START, "agent")

    // Décision -> Soit on agit (tools), soit on répond (END)
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })

    // Boucle -> Après l'action, on retourne voir l'agent pour qu'il analyse le résultat
    .addEdge("tools", "agent");

  return workflow.compile();
}

