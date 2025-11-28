import { google } from "googleapis";

import { prisma } from "@/lib/prisma";
import type { AuthError, GoogleTokenResponse, TokenValidationResult } from "@/types/next-auth";

class TokenManager {
  private static readonly TOKEN_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

  async getValidAccessToken(userId: string): Promise<TokenValidationResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!user?.googleAccessToken) {
      const error = new Error("No access token found for user") as AuthError;
      error.code = "REAUTH_REQUIRED";
      throw error;
    }

    const now = Date.now();
    const expiresAt = user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : 0;
    const needsRefresh = expiresAt - now < TokenManager.TOKEN_BUFFER_MS;

    if (!needsRefresh) {
      return {
        accessToken: user.googleAccessToken,
        refreshed: false,
        expiresAt: new Date(expiresAt),
      };
    }

    if (!user.googleRefreshToken) {
      const error = new Error("No refresh token available") as AuthError;
      error.code = "REAUTH_REQUIRED";
      throw error;
    }

    const newTokens = await this.refreshToken(userId, user.googleRefreshToken);
    return {
      accessToken: newTokens.access_token,
      refreshed: true,
      expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
    };
  }

  private async refreshToken(userId: string, refreshToken: string): Promise<GoogleTokenResponse> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const tokens: GoogleTokenResponse = await response.json();

    if (!response.ok) {
      if (tokens && (tokens as any).error === "invalid_grant") {
        const error = new Error("Refresh token is invalid") as AuthError;
        error.code = "REAUTH_REQUIRED";
        throw error;
      }
      throw new Error(`Token refresh failed: ${(tokens as any).error}`);
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: expiresAt,
        ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
      },
    });

    return tokens;
  }

  async getAuthenticatedClient(userId: string) {
    const { accessToken } = await this.getValidAccessToken(userId);
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }
}

export const tokenManager = new TokenManager();
