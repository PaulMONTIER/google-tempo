/**
 * Gère les erreurs des outils et retourne un format standardisé
 * @param error - Erreur capturée
 * @param toolName - Nom de l'outil pour les logs
 * @param defaultMessage - Message d'erreur par défaut
 * @param returnString - Si true, retourne une string simple au lieu de JSON (pour getEventsTool)
 * @returns Réponse formatée (JSON stringifié ou string simple)
 */
export function handleToolError(
  error: any,
  toolName: string,
  defaultMessage: string,
  returnString: boolean = false
): string {
  console.error(`[${toolName}] Error:`, error);

  // Gérer les erreurs OAuth
  if (error.code === "REAUTH_REQUIRED") {
    const reauthMessage = "Votre session Google a expiré. Veuillez vous reconnecter pour accéder à votre calendrier.";
    
    if (returnString) {
      return reauthMessage;
    }
    
    return JSON.stringify({
      error: reauthMessage,
      success: false,
      requiresReauth: true,
    });
  }

  // Erreur générique
  const errorMessage = `${defaultMessage} : ${error.message}`;
  
  if (returnString) {
    return errorMessage;
  }
  
  return JSON.stringify({
    error: errorMessage,
    success: false,
  });
}

