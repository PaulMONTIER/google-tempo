import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiry?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiry?: number;
    userId?: string;
    error?: string;
  }
}

export interface TokenValidationResult {
  accessToken: string;
  refreshed: boolean;
  expiresAt: Date;
}

export interface AuthError extends Error {
  code: "TOKEN_EXPIRED" | "REFRESH_FAILED" | "REAUTH_REQUIRED" | "NETWORK_ERROR";
  originalError?: Error;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token?: string;
}
