/**
 * Valide et extrait le userId depuis la configuration de l'outil
 * @param config - Configuration de l'outil LangChain
 * @returns userId si présent, sinon lance une erreur
 * @throws Error si userId manquant
 */
export function validateUserId(config: any): string {
  const userId = config?.configurable?.userId;
  
  if (!userId) {
    throw new Error("Configuration utilisateur manquante. Veuillez vous reconnecter.");
  }
  
  return userId;
}

