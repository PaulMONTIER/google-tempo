import { SystemMessage } from "@langchain/core/messages";
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { findFreeSlotsTool, createEventTool, addMeetToEventTool, getEventsTool, deleteEventTool } from "./tools/calendar";

// --- 1. CONFIGURATION DU MODÈLE (LE CERVEAU) ---

// On définit les outils disponibles
const tools = [findFreeSlotsTool, createEventTool, addMeetToEventTool, getEventsTool, deleteEventTool];
const toolNode = new ToolNode(tools);

// On configure Gemini
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-flash", // ✅ Version STABLE avec tool calling optimisé (Juin 2025, 1M tokens)
  temperature: 0, // Zéro pour une logique stricte (éviter la créativité dans les dates)
  apiKey: process.env.GOOGLE_API_KEY, // Clé API AI Studio (différente de OAuth)
}).bindTools(tools);


// --- 2. LE "CERVEAU" (System Prompt façon ReAct) ---
// On lui donne le script exact qu'il doit suivre

const SYSTEM_PROMPT_TEMPLATE = `
Tu es Tempo, un agent IA connecté à Google Calendar.
DATE ACTUELLE : {current_date} à {current_time} (Paris).

⚠️ RÈGLE CRITIQUE : Ne JAMAIS supprimer un événement sauf si l'utilisateur dit EXPLICITEMENT "supprimer", "annuler", "enlever" ou "retirer".

---

POUR AFFICHER/CONSULTER LES ÉVÉNEMENTS :
Mots-clés : "afficher", "voir", "qu'est-ce que j'ai", "mon planning", "mes événements"
→ Utilise 'get_calendar_events' avec la période demandée
→ AFFICHE LA LISTE COMPLÈTE des événements dans ta réponse (titre, date, heure)
→ Ne résume pas, montre tous les détails
→ C'EST TOUT. N'appelle aucun autre outil.

---

POUR CRÉER UN ÉVÉNEMENT :
Mots-clés : "crée", "ajoute", "planifie", "réserve", "bloque"
1. Appelle 'find_free_slots' pour vérifier les disponibilités
2. Si libre : appelle 'create_calendar_event'
3. Confirme la création

ARBRE DE PRÉPARATION :
Quand tu crées des événements de préparation (révisions, études) menant à un objectif (contrôle, examen) :
1. Génère un ID unique pour l'arbre (ex: "tree_math_123")
2. Ajoute ce marqueur INVISIBLE à la fin de la description de CHAQUE événement :
   - Pour l'objectif : <!--tree:ID:goal-->
   - Pour les préparations : <!--tree:ID:branch-->
Exemple : description = "Révision chapitre 3<!--tree:tree_math_123:branch-->"

---

POUR SUPPRIMER UN ÉVÉNEMENT :
Mots-clés OBLIGATOIRES : "supprimer", "annuler", "enlever", "retirer"
⚠️ Si ces mots ne sont PAS présents, NE SUPPRIME PAS.
1. Utilise 'get_calendar_events' pour trouver l'événement et son ID
2. Utilise 'delete_calendar_event' avec l'ID
3. Confirme la suppression

---

RÈGLES :
- Sois concis dans tes réponses
- Ne demande confirmation que s'il y a une vraie ambiguïté
`;

// --- 3. LE NOEUD DE L'AGENT (LA CONSCIENCE DU TEMPS) ---

// C'est ici que la magie opère. On intercepte l'appel pour injecter le temps réel.
async function callModel(state: typeof MessagesAnnotation.State) {
  const { messages } = state;

  // A. Calcul du temps présent
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const timeFormatter = new Intl.DateTimeFormat('fr-FR', { 
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' 
  });

  // B. Construction du Prompt Système Dynamique
  const dynamicSystemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{current_date}', dateFormatter.format(now))
    .replace('{current_time}', timeFormatter.format(now));

  // C. Fusion : System Prompt + Historique de conversation
  // On ajoute le system prompt au début de la liste des messages envoyés à Gemini
  // Note: LangChain gère cela intelligemment sans écraser l'historique visible
  
  // 🔍 DEBUG: Ce que le LLM reçoit
  console.log(`\n🧠 [AGENT NODE] Réflexion en cours...`);
  console.log(`📨 [AGENT NODE] Messages entrants (${messages.length} total):`);
  messages.forEach((msg, i) => {
    const type = msg.constructor.name;
    const contentPreview = typeof msg.content === 'string' 
      ? msg.content.substring(0, 150).replace(/\n/g, ' ')
      : JSON.stringify(msg.content).substring(0, 150);
    console.log(`  [${i}] ${type}: ${contentPreview}${contentPreview.length >= 150 ? '...' : ''}`);
    if ((msg as any).tool_calls?.length) {
      console.log(`      ⚙️  Tool calls demandés: ${(msg as any).tool_calls.map((tc: any) => tc.name).join(', ')}`);
    }
  });

  const result = await model.invoke([
    new SystemMessage(dynamicSystemPrompt), 
    ...messages
  ]);

  // 🔍 DEBUG: Ce que le LLM répond
  console.log(`\n💭 [AGENT NODE] Réponse du LLM:`);
  console.log(`   Type: ${result.constructor.name}`);
  const resultContent = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  console.log(`   Content: ${resultContent.substring(0, 200)}${resultContent.length > 200 ? '...' : ''}`);
  if (result.tool_calls?.length) {
    console.log(`   🛠️  DÉCISION: Appeler les outils → ${result.tool_calls.map((tc: any) => tc.name).join(', ')}`);
  } else {
    console.log(`   ✋ DÉCISION: Arrêt (pas d'outil à appeler, réponse finale)`);
  }

  return { messages: [result] };
}


// --- 4. LOGIQUE DE ROUTING (LA PRISE DE DÉCISION) ---

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // Si le LLM a décidé d'appeler un outil (il a généré un tool_call)
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  
  // Sinon, il a généré du texte final, on s'arrête.
  return END;
}


// --- 5. CONSTRUCTION DU GRAPHE (LE SYSTÈME NERVEUX) ---

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  
  // Point d'entrée -> L'agent réfléchit
  .addEdge(START, "agent")
  
  // Décision -> Soit on agit (tools), soit on répond (END)
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END,
  })
  
  // Boucle -> Après l'action, on retourne voir l'agent pour qu'il analyse le résultat
  .addEdge("tools", "agent");

// Compilation finale
export const agentExecutor = workflow.compile();

