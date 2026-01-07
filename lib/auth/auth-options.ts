import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import { prisma } from "@/lib/prisma";

const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const expiresAt = Date.now() + refreshedTokens.expires_in * 1000;

    if (token.userId) {
      await prisma.user.update({
        where: { id: token.userId },
        data: {
          googleAccessToken: refreshedTokens.access_token,
          googleTokenExpiry: new Date(expiresAt),
          ...(refreshedTokens.refresh_token && { googleRefreshToken: refreshedTokens.refresh_token }),
        },
      });
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpiry: expiresAt,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "select_account consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        const expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleAccessToken: account.access_token ?? null,
            googleRefreshToken: account.refresh_token ?? null,
            googleTokenExpiry: new Date(expiresAt),
          },
        });

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpiry: expiresAt,
          userId: user.id,
        };
      }

      const now = Date.now();
      const expiresAt = typeof token.accessTokenExpiry === "number" ? token.accessTokenExpiry : undefined;
      const bufferTime = 5 * 60 * 1000;

      if (expiresAt && now < expiresAt - bufferTime) {
        return token;
      }

      if (!token.refreshToken) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string | undefined;
        if (session.user) {
          session.user.id = token.userId as string;
        }
        if (token.error === "RefreshAccessTokenError") {
          session.error = "REAUTH_REQUIRED";
        }
      }
      return session;
    },
  },
};
