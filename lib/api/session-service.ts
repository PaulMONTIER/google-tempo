// Point unique d'accès à la session applicative.
// En production : délègue à NextAuth (getServerSession + authOptions).
// En tests : ce module peut être mocké pour simuler un utilisateur connecté
// sans dépendre de Google OAuth.

import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * Récupère la session applicative courante.
 * - Production : NextAuth + Google OAuth
 * - Tests : peut être mockée pour retourner une session factice
 */
export async function getAppSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}



