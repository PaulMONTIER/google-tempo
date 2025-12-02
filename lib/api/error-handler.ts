import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * Classe d'erreur personnalisée pour les erreurs API
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Interface pour le format de réponse d'erreur standardisé
 */
interface ErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
  requiresReauth?: boolean;
}

/**
 * Gère les erreurs API et retourne une réponse NextResponse standardisée
 * @param error - L'erreur à gérer (peut être de n'importe quel type)
 * @param context - Contexte optionnel pour le logging (nom de la route, etc.)
 * @returns NextResponse avec le format d'erreur standardisé
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  const contextPrefix = context ? `[${context}] ` : "";

  // Si c'est une ApiError personnalisée, utiliser ses propriétés
  if (error instanceof ApiError) {
    logger.error(`${contextPrefix}ApiError:`, {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    });

    const response: ErrorResponse = {
      error: error.message,
    };

    if (error.code) {
      response.code = error.code;
    }

    if (error.details !== undefined) {
      response.details = error.details;
    } else if (process.env.NODE_ENV === "development") {
      // En développement, inclure la stack trace
      response.details = error.stack;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Si c'est une erreur avec un code connu (ex: REAUTH_REQUIRED)
  if (error && typeof error === "object" && "code" in error) {
    const errorCode = (error as { code: string }).code;

    if (errorCode === "REAUTH_REQUIRED") {
      logger.warn(`${contextPrefix}Re-authentication required`);
      return NextResponse.json(
        {
          error: "Votre session Google a expiré. Veuillez vous reconnecter.",
          code: "REAUTH_REQUIRED",
          requiresReauth: true,
        },
        { status: 401 }
      );
    }
  }

  // Erreur inconnue
  const errorMessage =
    error instanceof Error ? error.message : "Une erreur inattendue s'est produite";

  logger.error(`${contextPrefix}Unexpected error:`, error);

  const response: ErrorResponse = {
    error: "Une erreur est survenue lors du traitement de votre demande",
  };

  // En développement, inclure plus de détails
  if (process.env.NODE_ENV === "development") {
    response.details = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.stack) {
      response.details = error.stack;
    }
  }

  return NextResponse.json(response, { status: 500 });
}

