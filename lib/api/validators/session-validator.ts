import { NextResponse } from "next/server";
import { Session } from "next-auth";

interface ValidationResult {
  userId: string;
  error?: NextResponse;
}

/**
 * Valide la session utilisateur et extrait le userId
 * @param session - Session NextAuth
 * @returns Objet avec userId ou erreur NextResponse
 */
export function validateSession(session: Session | null): ValidationResult {
  if (!session?.user?.id) {
    return {
      userId: "",
      error: NextResponse.json(
        { error: "Non authentifié", requiresAuth: true },
        { status: 401 }
      ),
    };
  }

  if (session.error === "REAUTH_REQUIRED") {
    return {
      userId: "",
      error: NextResponse.json(
        {
          error: "Votre session Google a expiré. Veuillez vous reconnecter.",
          requiresReauth: true,
        },
        { status: 401 }
      ),
    };
  }

  return {
    userId: session.user.id,
  };
}

