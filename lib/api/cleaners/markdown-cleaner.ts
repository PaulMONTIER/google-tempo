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
    .replace(/`/g, "") // Retire le code inline
    .replace(/\[id:[^\]]+\]/g, ""); // Retire les IDs techniques
}

