/**
 * Nettoie le markdown d'une réponse pour l'affichage dans le chat
 * Retire les éléments de formatage markdown et les IDs techniques
 * @param content - Contenu à nettoyer (peut être string ou autre type)
 * @returns Contenu nettoyé (string)
 */
export function cleanMarkdown(content: unknown): string {
  if (typeof content !== "string") {
    return "";
  }

  return content
    .replace(/\*\*/g, "") // Retire le gras
    .replace(/\*/g, "") // Retire l'italique
    .replace(/#{1,6}\s/g, "") // Retire les titres
    .replace(/`{3}json[\s\S]*?`{3}/g, "") // Retire les blocs JSON (propositions)
    .replace(/`/g, "") // Retire le code inline
    .replace(/\[id:[^\]]+\]/g, "") // Retire les IDs techniques
    .trim(); // Retire les espaces en trop
}

/**
 * Extrait la proposition JSON d'une réponse de l'agent
 * @param content - Contenu de la réponse
 * @returns La proposition parsée ou null
 */
export function extractProposal(content: string): {
  type: string;
  semanticType: string;
  options: string[];
} | null {
  const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
  
  if (!jsonMatch) {
    return null;
  }

  try {
    const proposal = JSON.parse(jsonMatch[1]);
    if (proposal.type === 'proposal') {
      return proposal;
    }
  } catch {
    // Pas du JSON valide
  }
  
  return null;
}

