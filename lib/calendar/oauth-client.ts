import { google } from "googleapis";
import { tokenManager } from "@/lib/auth/token-manager";

/**
 * Obtient un client Calendar API authentifié pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Client Calendar API configuré avec les credentials OAuth2
 */
export async function getCalendarClient(userId: string) {
  const { accessToken } = await tokenManager.getValidAccessToken(userId);
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  return google.calendar({ version: "v3", auth: oauth2Client });
}

